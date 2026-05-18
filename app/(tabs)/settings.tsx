import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useClerk, useUser } from '@clerk/expo'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { styled } from 'nativewind'
import { clsx } from 'clsx'
import React, { ReactNode, useMemo } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { usePostHog } from 'posthog-react-native'

import images from '@/constants/images'
import { colors, components } from '@/constants/theme'
import { formatCurrency } from '@/libs/utils'
import { useSubscriptions } from '@/src/context/SubscriptionsContext'
import {
  getActiveSubscriptions,
  getMonthlyTotalInCurrency,
  getMonthlyTotalEntries,
  getUpcomingSubscriptions,
  supportedSpendCurrencies,
} from '@/src/libs/subscriptionMetrics'

const SafeAreaView = styled(RNSafeAreaView)

type SettingsRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  title: string
  value: string
  tone?: 'default' | 'danger'
  onPress?: () => void
}

const SettingsSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <View className="mt-6">
    <Text className="mb-3 text-sm font-sans-bold uppercase text-muted-foreground">{title}</Text>
    <View className="overflow-hidden rounded-3xl border border-border bg-card">{children}</View>
  </View>
)

const SettingsRow = ({ icon, title, value, tone = 'default', onPress }: SettingsRowProps) => {
  const content = (
    <View className="flex-row items-center gap-3 p-4">
      <View
        className="size-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: tone === 'danger' ? 'rgba(220, 38, 38, 0.1)' : colors.muted }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={tone === 'danger' ? colors.destructive : colors.primary}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={tone === 'danger' ? 'font-sans-bold text-destructive' : 'font-sans-bold text-primary'}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text className="mt-1 text-sm font-sans-medium text-muted-foreground" numberOfLines={2}>
          {value}
        </Text>
      </View>
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.mutedForeground} />
      ) : null}
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>
  }

  return content
}

const SettingsDivider = () => <View className="ml-20 h-px bg-border" />

const Settings = () => {
  const router = useRouter()
  const { signOut } = useClerk()
  const { user } = useUser()
  const { subscriptions, monthlySpendCurrency, setMonthlySpendCurrency } = useSubscriptions()
  const posthog = usePostHog()

  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'SpendLock'
  const emailAddress = user?.primaryEmailAddress?.emailAddress || 'Signed in'
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar
  const activeSubscriptions = useMemo(() => getActiveSubscriptions(subscriptions), [subscriptions])
  const monthlyTotals = useMemo(() => getMonthlyTotalEntries(subscriptions), [subscriptions])
  const monthlySpendTotal = useMemo(
    () => getMonthlyTotalInCurrency(subscriptions, monthlySpendCurrency),
    [monthlySpendCurrency, subscriptions],
  )
  const upcomingRenewals = useMemo(() => getUpcomingSubscriptions(subscriptions), [subscriptions])
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime to continue tracking your subscriptions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            posthog.capture('user_signed_out')
            posthog.reset()
            await signOut()
            router.replace('/(auth)/sign-in')
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: components.tabBar.height + 44 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="subs-title">Settings</Text>
        <Text className="subs-subtitle">Manage your account, subscription profile, and app details.</Text>

        <View className="mt-6 rounded-3xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-4">
            <Image source={avatarSource} className="size-16 rounded-full" />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-xl font-sans-bold text-primary">
                {displayName}
              </Text>
              <Text numberOfLines={1} className="mt-1 text-sm font-sans-medium text-muted-foreground">
                {emailAddress}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-muted p-3">
              <Text className="text-xs font-sans-semibold text-muted-foreground">Active</Text>
              <Text className="mt-1 text-2xl font-sans-bold text-primary">
                {activeSubscriptions.length}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-muted p-3">
              <Text className="text-xs font-sans-semibold text-muted-foreground">Monthly</Text>
              <Text className="mt-1 text-xl font-sans-bold text-primary" numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(monthlySpendTotal, monthlySpendCurrency)}
              </Text>
            </View>
          </View>
        </View>

        <SettingsSection title="Subscription profile">
          <SettingsRow
            icon="calendar-clock"
            title="Upcoming renewals"
            value={
              upcomingRenewals.length
                ? `${upcomingRenewals.length} renewal${upcomingRenewals.length === 1 ? '' : 's'} scheduled`
                : 'No renewals scheduled yet'
            }
          />
          <SettingsDivider />
          <SettingsRow
            icon="credit-card-outline"
            title="Payment methods"
            value="Payment labels are stored with each subscription you add."
          />
          <SettingsDivider />
          <SettingsRow
            icon="currency-usd"
            title="Currencies"
            value={monthlyTotals.length ? monthlyTotals.map(([currency]) => currency).join(', ') : 'USD by default'}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <View className="p-4">
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-2xl bg-muted">
                <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-primary">Monthly spend currency</Text>
                <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                  Home and Insights convert monthly spend into this currency.
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {supportedSpendCurrencies.map((currency) => {
                const isActive = monthlySpendCurrency === currency

                return (
                  <Pressable
                    key={currency}
                    className={clsx('category-chip', isActive && 'category-chip-active')}
                    onPress={() => setMonthlySpendCurrency(currency)}
                  >
                    <Text
                      className={clsx(
                        'category-chip-text',
                        isActive && 'category-chip-text-active',
                      )}
                    >
                      {currency}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
          <SettingsDivider />
          <SettingsRow
            icon="bell-outline"
            title="Renewal reminders"
            value="Upcoming renewals are highlighted on Home and Insights."
          />
          <SettingsDivider />
          <SettingsRow
            icon="theme-light-dark"
            title="Appearance"
            value="Warm SpendLock theme"
          />
          <SettingsDivider />
          <SettingsRow
            icon="chart-box-outline"
            title="Insights"
            value="Monthly estimates are grouped by currency to keep totals accurate."
          />
        </SettingsSection>

        <SettingsSection title="Account and security">
          <SettingsRow
            icon="shield-check-outline"
            title="Authentication"
            value="Your sign-in is secured through Clerk."
          />
          <SettingsDivider />
          <SettingsRow
            icon="email-outline"
            title="Primary email"
            value={emailAddress}
          />
        </SettingsSection>

        <SettingsSection title="App">
          <SettingsRow icon="cellphone" title="Version" value={appVersion} />
          <SettingsDivider />
          <SettingsRow
            icon="database-outline"
            title="Data"
            value="Subscriptions are currently stored for this app session."
          />
        </SettingsSection>

        <Pressable className="mt-6 items-center rounded-2xl bg-primary py-4" onPress={handleSignOut}>
          <Text className="text-base font-sans-bold text-background">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Settings
