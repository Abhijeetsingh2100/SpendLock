import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView as RNSafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {styled} from "nativewind";
import SubscriptionCard from '@/components/SubscriptionCard';
import { components } from '@/constants/theme';
import { useSubscriptions } from '@/src/context/SubscriptionsContext';

 const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const { subscriptions } = useSubscriptions();

  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return subscriptions;
    }

    return subscriptions.filter((subscription) => {
      const searchableText = [
        subscription.name,
        subscription.plan,
        subscription.category,
        subscription.billing,
        subscription.currency,
        subscription.paymentMethod,
        subscription.status,
        subscription.price.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchQuery, subscriptions]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const listBottomPadding = keyboardHeight
    ? keyboardHeight + components.tabBar.height
    : components.tabBar.height + components.tabBar.horizontalInset + insets.bottom;

  return (
    <SafeAreaView className='flex-1 bg-background p-5'>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={filteredSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() =>
                setExpandedSubscriptionId((currentId) =>
                  currentId === item.id ? null : item.id,
                )
              }
            />
          )}
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: listBottomPadding }}
          ListHeaderComponent={
            <View>
              <Text className="subs-title">Subscriptions</Text>
              <Text className="subs-subtitle">
                Search and manage your recurring payments.
              </Text>

              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search subscriptions"
                placeholderTextColor="rgba(0, 0, 0, 0.45)"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                className="subs-search"
              />

              <View className="subs-list-head">
                <Text className="subs-list-title">
                  {searchQuery.trim() ? 'Search Results' : 'All Subscriptions'}
                </Text>
                <Text className="subs-count">
                  {filteredSubscriptions.length}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={() => (
            <Text className="home-empty-state">
              No subscriptions match your search
            </Text>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Subscriptions
