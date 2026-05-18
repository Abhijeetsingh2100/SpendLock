import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import "@/global.css";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import images from "@/constants/images";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/libs/utils";
import CreateSubscriptionModal from "@/src/components/CreateSubscriptionModal";
import SubscriptionActionsModal from "@/src/components/SubscriptionActionsModal";
import SubscriptionListModal from "@/src/components/SubscriptionListModal";
import { useSubscriptions } from "@/src/context/SubscriptionsContext";
import {
  getMonthlyTotalInCurrency,
  getUpcomingSubscriptions,
} from "@/src/libs/subscriptionMetrics";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [activeListModal, setActiveListModal] = useState<"upcoming" | "all" | null>(null);
  const {
    subscriptions,
    monthlySpendCurrency,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions();
  const { user } = useUser();
  const posthog = usePostHog();

  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "SpendLock";
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;
  const upcomingRenewals = getUpcomingSubscriptions(subscriptions);
  const upcomingPreview = upcomingRenewals.slice(0, 5);
  const upcomingSubscriptions = upcomingRenewals.map(({ subscription }) => subscription);
  const monthlySpendTotal = getMonthlyTotalInCurrency(subscriptions, monthlySpendCurrency);
  const monthlySpendLabel = formatCurrency(monthlySpendTotal, monthlySpendCurrency);
  const nextRenewal = upcomingRenewals[0];
  const homeSubscriptions = subscriptions.slice(0, 4);

  const handleCreateSubscription = (subscription: Subscription) => {
    addSubscription(subscription);
    posthog.capture("subscription_created", {
      subscription_id: subscription.id,
      subscription_name: subscription.name,
      category: subscription.category ?? "Other",
      billing: subscription.billing,
    });
  };

  const handleSaveEditedSubscription = (subscription: Subscription) => {
    updateSubscription(subscription);
    setEditingSubscription(null);
    posthog.capture("subscription_updated", {
      subscription_id: subscription.id,
      subscription_name: subscription.name,
    });
  };

  const handleDeleteSubscription = () => {
    if (!selectedSubscription) return;

    const subscriptionToDelete = selectedSubscription;
    Alert.alert(
      "Delete subscription?",
      `${subscriptionToDelete.name} will be removed from your dashboard.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteSubscription(subscriptionToDelete.id);
            setExpandedSubscriptionId((currentId) =>
              currentId === subscriptionToDelete.id ? null : currentId,
            );
            setSelectedSubscription(null);
            posthog.capture("subscription_deleted", {
              subscription_id: subscriptionToDelete.id,
              subscription_name: subscriptionToDelete.name,
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={homeSubscriptions}
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image source={avatarSource} className="home-avatar" />
                <Text numberOfLines={1} className="home-user-name">
                  {displayName}
                </Text>
              </View>

              <Pressable onPress={() => setIsCreateModalVisible(true)}>
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Monthly Spend</Text>
              <View className="home-balance-row">
                <Text
                  className="home-balance-amount"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}
                >
                  {monthlySpendLabel}
                </Text>
                <Text className="home-balance-date">
                  {nextRenewal ? dayjs(nextRenewal.subscription.renewalDate).format("MM/DD") : "--/--"}
                </Text>
              </View>
              <Text className="mt-2 text-sm font-sans-semibold text-white/75">
                Estimated in {monthlySpendCurrency}. Change this in Settings.
              </Text>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" onViewAllPress={() => setActiveListModal("upcoming")} />
              <FlatList
                data={upcomingPreview}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard
                    id={item.subscription.id}
                    icon={item.subscription.icon}
                    iconGlyph={item.subscription.iconGlyph}
                    name={item.subscription.name}
                    price={item.subscription.price}
                    currency={item.subscription.currency}
                    daysLeft={item.daysLeft}
                  />
                )}
                keyExtractor={(item) => item.subscription.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">No upcoming renewals yet</Text>
                }
              />
            </View>

            <ListHeading title="All Subscriptions" onViewAllPress={() => setActiveListModal("all")} />
            {subscriptions.length ? (
              <Text className="-mt-3 mb-4 text-sm font-sans-semibold text-muted-foreground">
                Long press a subscription to edit or delete it.
              </Text>
            ) : null}
          </>
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) => {
                const next = currentId === item.id ? null : item.id;
                posthog.capture(next ? "subscription_card_expanded" : "subscription_card_collapsed", {
                  subscription_id: item.id,
                  subscription_name: item.name,
                });
                return next;
              })
            }
            onLongPress={() => setSelectedSubscription(item)}
          />
        )}
        extraData={{ expandedSubscriptionId, homeSubscriptions }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">
            No subscriptions yet. Tap + to add your first one.
          </Text>
        }
        contentContainerClassName="pb-30"
      />

      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={handleCreateSubscription}
      />
      <CreateSubscriptionModal
        visible={Boolean(editingSubscription)}
        initialSubscription={editingSubscription}
        onClose={() => setEditingSubscription(null)}
        onCreate={handleSaveEditedSubscription}
      />
      <SubscriptionListModal
        visible={activeListModal === "upcoming"}
        title="Upcoming Renewals"
        emptyMessage="No upcoming renewals yet"
        subscriptions={upcomingSubscriptions}
        onClose={() => setActiveListModal(null)}
        onSubscriptionLongPress={(subscription) => {
          setActiveListModal(null);
          setSelectedSubscription(subscription);
        }}
      />
      <SubscriptionListModal
        visible={activeListModal === "all"}
        title="All Subscriptions"
        emptyMessage="No subscriptions yet"
        subscriptions={subscriptions}
        onClose={() => setActiveListModal(null)}
        onSubscriptionLongPress={(subscription) => {
          setActiveListModal(null);
          setSelectedSubscription(subscription);
        }}
      />
      <SubscriptionActionsModal
        visible={Boolean(selectedSubscription)}
        subscription={selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
        onEdit={() => {
          setEditingSubscription(selectedSubscription);
          setSelectedSubscription(null);
        }}
        onDelete={handleDeleteSubscription}
      />
    </SafeAreaView>
  );
}
