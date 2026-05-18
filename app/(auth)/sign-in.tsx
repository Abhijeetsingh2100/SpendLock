import { isClerkAPIResponseError, useSignIn } from '@clerk/expo'
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
  identifier?: string
  password?: string
  code?: string
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

export default function SignIn() {
  const router = useRouter()
  const { signIn } = useSignIn()
  const posthog = usePostHog()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCodeStep, setIsCodeStep] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [authError, setAuthError] = useState('')

  const canSubmit = useMemo(
    () => identifier.trim().length > 0 && password.length > 0 && !isSubmitting,
    [identifier, password, isSubmitting],
  )

  const completeSignIn = async () => {
    if (!signIn) return

    const { error } = await signIn.finalize()

    if (error) {
      setAuthError(getAuthError(error, 'Your session could not be started. Please try again.'))
      return
    }

    const email = identifier.trim()
    posthog.identify(email, { $set: { email } })
    posthog.capture('user_signed_in', { email })

    router.replace('/(tabs)')
  }

  const validateForm = () => {
    const nextErrors: FieldErrors = {}
    const trimmedIdentifier = identifier.trim()

    if (!trimmedIdentifier) {
      nextErrors.identifier = 'Enter your email address.'
    } else if (!isEmailLike(trimmedIdentifier)) {
      nextErrors.identifier = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Enter your password.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!signIn || !validateForm()) return

    setIsSubmitting(true)
    setAuthError('')

    try {
      const { error } = await signIn.password({
        emailAddress: identifier.trim(),
        password,
      })

      if (error) {
        setAuthError(getAuthError(error, 'We could not sign you in with those details.'))
        posthog.capture('sign_in_failed', { reason: getAuthError(error, 'unknown') })
        return
      }

      if (signIn.status === 'complete') {
        await completeSignIn()
        return
      }

      if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
        const result = await signIn.mfa.sendEmailCode()

        if (result.error) {
          setAuthError(getAuthError(result.error, 'Enter the verification code for this account.'))
        }

        setIsCodeStep(true)
        return
      }

      setAuthError('This account needs another verification step before you can continue.')
    } catch (error) {
      setAuthError(getAuthError(error, 'We could not sign you in right now. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async () => {
    if (!signIn) return

    const trimmedCode = code.trim()

    if (trimmedCode.length < 6) {
      setFieldErrors({ code: 'Enter the 6 digit code.' })
      return
    }

    setIsVerifying(true)
    setFieldErrors({})
    setAuthError('')

    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code: trimmedCode })

      if (error) {
        setAuthError(getAuthError(error, 'That code did not work. Please check it and try again.'))
        return
      }

      if (signIn.status === 'complete') {
        await completeSignIn()
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
    if (!signIn) return

    setAuthError('')

    const { error } = await signIn.mfa.sendEmailCode()

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
            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Open your dashboard and keep every renewal, trial, and plan in one calm place.
            </Text>
          </View>

          <View className="auth-card">
            {!isCodeStep ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email address</Text>
                  <TextInput
                    className={clsx('auth-input', fieldErrors.identifier && 'auth-input-error')}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                  {fieldErrors.identifier && (
                    <Text className="auth-error">{fieldErrors.identifier}</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View className="relative">
                    <TextInput
                      className={clsx('auth-input pr-20', fieldErrors.password && 'auth-input-error')}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Your password"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showPassword}
                      textContentType="password"
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
                  {fieldErrors.password && <Text className="auth-error">{fieldErrors.password}</Text>}
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
                    <Text className="auth-button-text">Sign in</Text>
                  )}
                </Pressable>
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
                  <Text className="auth-helper">Enter the code sent to your email.</Text>
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
                  <Text className="auth-link">Use a different email</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">New to SpendLock?</Text>
            <Link href="/(auth)/sign-up">
              <Text className="auth-link">Create account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
