import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

import SubscriptionCard from "@/components/SubscriptionCard";

type SubscriptionListModalProps = {
  visible: boolean;
  title: string;
  emptyMessage: string;
  subscriptions: Subscription[];
  onClose: () => void;
  onSubscriptionLongPress?: (subscription: Subscription) => void;
};

const SubscriptionListModal = ({
  visible,
  title,
  emptyMessage,
  subscriptions,
  onClose,
  onSubscriptionLongPress,
}: SubscriptionListModalProps) => {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="modal-overlay">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="modal-container">
          <View className="modal-header">
            <Text className="modal-title">{title}</Text>
            <Pressable className="modal-close" onPress={onClose}>
              <Text className="modal-close-text">X</Text>
            </Pressable>
          </View>

          <FlatList
            data={subscriptions}
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
                onLongPress={() => onSubscriptionLongPress?.(item)}
              />
            )}
            ListHeaderComponent={
              subscriptions.length ? (
                <Text className="mb-4 text-sm font-sans-semibold text-muted-foreground">
                  Long press a subscription to edit or delete it.
                </Text>
              ) : null
            }
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={<Text className="home-empty-state">{emptyMessage}</Text>}
            contentContainerClassName="p-5 pb-10"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

export default SubscriptionListModal;
