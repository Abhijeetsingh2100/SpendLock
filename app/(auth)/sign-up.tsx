import { isClerkAPIResponseError, useSignUp } from '@clerk/expo'
import { Link, useRouter } from 'expo-router'
import { styled } from 'nativewind'
import React, { useMemo, useState } from 'react'
import { usePostHog } from 'posthog-react-native'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { clsx } from 'clsx'
import { colors } from '@/constants/theme'

const SafeAreaView = styled(RNSafeAreaView)

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  code?: string
}

type PasswordValidator = {
  validatePassword?: (
    password: string,
    callbacks?: {
      onValidation?: (result: {
        complexity?: Record<string, boolean | undefined>
        strength?: { state: 'excellent' | 'pass' | 'fail'; keys?: string[] }
      }) => void
      onValidationComplexity?: (isValid: boolean) => void
    },
  ) => void
}

const getAuthError = (error: unknown, fallback: string) => {
  if (!error) return fallback

  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.longMessage || error.errors[0]?.message || fallback
  }

  const possibleError = error as {
    longMessage?: string
    message?: string
    errors?: { longMessage?: string; message?: string }[]
  }

  return (
    possibleError.errors?.[0]?.longMessage ||
    possibleError.errors?.[0]?.message ||
    possibleError.longMessage ||
    possibleError.message ||
    fallback
  )
}

const isEmailLike = (value: string) => /^\S+@\S+\.\S+$/.test(value)

const getPasswordIssue = (password: string) => {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Use letters and numbers for a stronger password.'
  }
  return ''
}

const getClerkPasswordIssue = (validator: PasswordValidator | null, password: string) => {
  if (!validator?.validatePassword) return ''

  let hasValidComplexity = true
  let issue = ''

  try {
    validator.validatePassword(password, {
      onValidation: (result) => {
        const hasComplexityError = Object.values(result.complexity ?? {}).some(Boolean)

        if (hasComplexityError) {
          issue = 'Password does not meet the account security requirements.'
        }

        if (result.strength?.state === 'fail') {
          issue = 'Choose a stronger password.'
        }
      },
      onValidationComplexity: (isValid) => {
        hasValidComplexity = isValid
      },
    })
  } catch {
    return ''
  }

  if (!hasValidComplexity && !issue) {
    return 'Password does not meet the account security requirements.'
  }

  return issue
}


export default function SignUp() {
  const router = useRouter()
  const { signUp } = useSignUp()
  const posthog = usePostHog()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCodeStep, setIsCodeStep] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [authError, setAuthError] = useState('')

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      !isSubmitting,
    [name, email, password, confirmPassword, isSubmitting],
  )

  const completeSignUp = async () => {
    if (!signUp) return

    const { error } = await signUp.finalize()

    if (error) {
      setAuthError(getAuthError(error, 'Your account is ready, but we could not open it. Try signing in.'))
      return
    }

    const userEmail = email.trim()
    posthog.identify(userEmail, {
      $set: { email: userEmail, name: name.trim() },
      $set_once: { signup_date: new Date().toISOString() },
    })
    posthog.capture('user_signed_up', { email: userEmail, name: name.trim() })

    router.replace('/(tabs)')
  }

  const validateForm = (validator: PasswordValidator | null = null) => {
    const nextErrors: FieldErrors = {}
    const passwordIssue = getPasswordIssue(password) || getClerkPasswordIssue(validator, password)

    if (!name.trim()) {
      nextErrors.name = 'Enter your name.'
    }

    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.'
    } else if (!isEmailLike(email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Create a password.'
    } else if (passwordIssue) {
      nextErrors.password = passwordIssue
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!signUp || !validateForm(signUp as unknown as PasswordValidator)) return

    const [firstName, ...restName] = name.trim().split(/\s+/)
    const lastName = restName.join(' ')

    setIsSubmitting(true)
    setAuthError('')

    try {
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName: lastName || undefined,
        legalAccepted: true,
      })

      if (error) {
        setAuthError(getAuthError(error, 'We could not create your account with those details.'))
        posthog.capture('sign_up_failed', { reason: getAuthError(error, 'unknown') })
        return
      }

      if (signUp.status === 'complete') {
        await completeSignUp()
        return
      }

      if (signUp.unverifiedFields.includes('email_address')) {
        const result = await signUp.verifications.sendEmailCode()

        if (result.error) {
          setAuthError(getAuthError(result.error, 'We could not send your verification code.'))
          return
        }

        setIsCodeStep(true)
        return
      }

      setAuthError('Your account needs a little more information before it can be opened.')
    } catch (error) {
      setAuthError(getAuthError(error, 'We could not create your account right now. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async () => {
    if (!signUp) return

    const trimmedCode = code.trim()

    if (trimmedCode.length < 6) {
      setFieldErrors({ code: 'Enter the 6 digit code.' })
      return
    }

    setIsVerifying(true)
    setFieldErrors({})
    setAuthError('')

    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: trimmedCode })

      if (error) {
        setAuthError(getAuthError(error, 'That code did not work. Please check it and try again.'))
        return
      }

      if (signUp.status === 'complete') {
        await completeSignUp()
        return
      }

      setAuthError('We need one more check before opening your dashboard.')
    } catch (error) {
      setAuthError(getAuthError(error, 'We could not verify that code. Please try again.'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!signUp) return

    setAuthError('')

    const { error } = await signUp.verifications.sendEmailCode()

    if (error) {
      setAuthError(getAuthError(error, 'We could not send a new code. Please try again.'))
    }
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">S</Text>
              </View>
              <View>
                <Text className="auth-wordmark">SpendLock</Text>
                <Text className="auth-wordmark-sub">Subscription control</Text>
              </View>
            </View>
            <Text className="auth-title">{isCodeStep ? 'Check your inbox' : 'Start tracking smarter'}</Text>
            <Text className="auth-subtitle">
              {isCodeStep
                ? 'Use the code we sent to protect your account and open your dashboard.'
                : 'Build a secure place for renewals, trials, payments, and monthly decisions.'}
            </Text>
          </View>

          <View className="auth-card">
            {!isCodeStep ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Name</Text>
                  <TextInput
                    className={clsx('auth-input', fieldErrors.name && 'auth-input-error')}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                  />
                  {fieldErrors.name && <Text className="auth-error">{fieldErrors.name}</Text>}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Email address</Text>
                  <TextInput
                    className={clsx('auth-input', fieldErrors.email && 'auth-input-error')}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                  {fieldErrors.email && <Text className="auth-error">{fieldErrors.email}</Text>}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View className="relative">
                    <TextInput
                      className={clsx('auth-input pr-20', fieldErrors.password && 'auth-input-error')}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 8 characters"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                    />
                    <Pressable
                      className="absolute right-4 top-4"
                      onPress={() => setShowPassword((current) => !current)}
                    >
                      <Text className="text-sm font-sans-bold text-accent">
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                  {fieldErrors.password ? (
                    <Text className="auth-error">{fieldErrors.password}</Text>
                  ) : (
                    <Text className="auth-helper">Use a password you do not use anywhere else.</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Confirm password</Text>
                  <TextInput
                    className={clsx('auth-input', fieldErrors.confirmPassword && 'auth-input-error')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                  />
                  {fieldErrors.confirmPassword && (
                    <Text className="auth-error">{fieldErrors.confirmPassword}</Text>
                  )}
                </View>

                {authError && <Text className="auth-error">{authError}</Text>}

                <Pressable
                  className={clsx('auth-button', !canSubmit && 'auth-button-disabled')}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text className="auth-button-text">Create account</Text>
                  )}
                </Pressable>

                <View nativeID="clerk-captcha" />
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={clsx('auth-input', fieldErrors.code && 'auth-input-error')}
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    maxLength={8}
                  />
                  <Text className="auth-helper">Sent to {email.trim()}.</Text>
                  {fieldErrors.code && <Text className="auth-error">{fieldErrors.code}</Text>}
                </View>

                {authError && <Text className="auth-error">{authError}</Text>}

                <Pressable
                  className={clsx('auth-button', isVerifying && 'auth-button-disabled')}
                  onPress={handleVerify}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text className="auth-button-text">Verify and continue</Text>
                  )}
                </Pressable>

                <Pressable className="auth-secondary-button" onPress={handleResendCode}>
                  <Text className="auth-secondary-button-text">Send a new code</Text>
                </Pressable>

                <Pressable
                  className="items-center py-2"
                  onPress={() => {
                    setIsCodeStep(false)
                    setCode('')
                    setAuthError('')
                  }}
                >
                  <Text className="auth-link">Edit account details</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">Already tracking?</Text>
            <Link href="/(auth)/sign-in">
              <Text className="auth-link">Sign in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
