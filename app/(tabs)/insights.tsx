import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { styled } from "nativewind";
import React, { useMemo } from "react";
import { DimensionValue, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

import { colors, components } from "@/constants/theme";
import { formatCurrency } from "@/libs/utils";
import { useSubscriptions } from "@/src/context/SubscriptionsContext";
import {
  convertCurrency,
  getActiveSubscriptions,
  getMonthlyEquivalent,
  getMonthlyTotalInCurrency,
  getMonthlyTotalEntries,
  getUpcomingSubscriptions,
} from "@/src/libs/subscriptionMetrics";

const SafeAreaView = styled(RNSafeAreaView);

const Insights = () => {
  const { subscriptions, monthlySpendCurrency } = useSubscriptions();

  const activeSubscriptions = useMemo(() => getActiveSubscriptions(subscriptions), [subscriptions]);
  const monthlyTotalEntries = useMemo(() => getMonthlyTotalEntries(subscriptions), [subscriptions]);
  const monthlySpendTotal = useMemo(
    () => getMonthlyTotalInCurrency(subscriptions, monthlySpendCurrency),
    [monthlySpendCurrency, subscriptions],
  );
  const monthlySpendLabel = formatCurrency(monthlySpendTotal, monthlySpendCurrency);
  const upcomingRenewals = useMemo(() => getUpcomingSubscriptions(subscriptions, 3), [subscriptions]);

  const categoryBreakdown = useMemo(() => {
    const totals = activeSubscriptions.reduce<Record<string, number>>((result, subscription) => {
        const category = subscription.category ?? "Other";
        result[category] =
          (result[category] ?? 0) +
          convertCurrency(
            getMonthlyEquivalent(subscription),
            subscription.currency,
            monthlySpendCurrency,
          );
        return result;
      }, {});

    const maxTotal = Math.max(...Object.values(totals), 0);

    return Object.entries(totals)
      .sort((first, second) => second[1] - first[1])
      .map(([category, total]) => ({
        category,
        total,
        width: (maxTotal ? `${Math.max((total / maxTotal) * 100, 8)}%` : "8%") as DimensionValue,
      }));
  }, [activeSubscriptions, monthlySpendCurrency]);

  const topCategory = categoryBreakdown[0]?.category;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: components.tabBar.height + 44 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="subs-title">Insights</Text>
        <Text className="subs-subtitle">
          Understand where your recurring money is going.
        </Text>

        <View className="mt-6 rounded-3xl bg-primary p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-sans-semibold text-background/65">Estimated monthly</Text>
              <Text
                className="mt-2 text-4xl font-sans-extrabold text-background"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
              >
                {monthlySpendLabel}
              </Text>
            </View>
            <View className="size-14 items-center justify-center rounded-2xl bg-accent">
              <MaterialCommunityIcons name="chart-donut" size={30} color={colors.primary} />
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-background/10 p-3">
              <Text className="text-xs font-sans-semibold text-background/60">Active</Text>
              <Text className="mt-1 text-2xl font-sans-bold text-background">
                {activeSubscriptions.length}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-background/10 p-3">
              <Text className="text-xs font-sans-semibold text-background/60">Next renewal</Text>
              <Text className="mt-1 text-2xl font-sans-bold text-background">
                {upcomingRenewals[0]
                  ? dayjs(upcomingRenewals[0].subscription.renewalDate).format("MMM D")
                  : "--"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-card p-4">
            <Text className="text-sm font-sans-semibold text-muted-foreground">Top category</Text>
            <Text className="mt-2 text-xl font-sans-bold text-primary" numberOfLines={1}>
              {topCategory ?? "None yet"}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-card p-4">
            <Text className="text-sm font-sans-semibold text-muted-foreground">Currencies</Text>
            <Text className="mt-2 text-xl font-sans-bold text-primary">
              {monthlyTotalEntries.length || 0}
            </Text>
          </View>
        </View>

        <View className="mt-7">
          <Text className="list-title">Currency totals</Text>
          <View className="mt-4 gap-3">
            {monthlyTotalEntries.length ? (
              monthlyTotalEntries.map(([currency, total]) => (
                <View
                  key={currency}
                  className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <Text className="font-sans-bold text-primary">{currency}</Text>
                  <Text className="font-sans-bold text-primary">
                    {formatCurrency(total, currency)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="home-empty-state">Add subscriptions to unlock currency insights.</Text>
            )}
          </View>
        </View>

        <View className="mt-7">
          <Text className="list-title">Category breakdown</Text>
          <View className="mt-4 gap-4">
            {categoryBreakdown.length ? (
              categoryBreakdown.map((item) => (
                <View key={item.category} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans-semibold text-primary">{item.category}</Text>
                    <Text className="font-sans-semibold text-muted-foreground">
                      {formatCurrency(item.total, monthlySpendCurrency)}
                    </Text>
                  </View>
                  <View className="h-3 overflow-hidden rounded-full bg-muted">
                    <View className="h-3 rounded-full bg-accent" style={{ width: item.width }} />
                  </View>
                </View>
              ))
            ) : (
              <Text className="home-empty-state">No categories to analyze yet.</Text>
            )}
          </View>
        </View>

        <View className="mt-7">
          <Text className="list-title">Upcoming pressure</Text>
          <View className="mt-4 gap-3">
            {upcomingRenewals.length ? (
              upcomingRenewals.map(({ subscription, daysLeft }) => (
                <View
                  key={subscription.id}
                  className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-bold text-primary" numberOfLines={1}>
                      {subscription.name}
                    </Text>
                    <Text className="mt-1 text-sm font-sans-semibold text-muted-foreground">
                      {daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? "Tomorrow" : "Today"}
                    </Text>
                  </View>
                  <Text className="ml-3 font-sans-bold text-primary">
                    {formatCurrency(subscription.price, subscription.currency)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="home-empty-state">No upcoming renewal pressure yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Insights;
