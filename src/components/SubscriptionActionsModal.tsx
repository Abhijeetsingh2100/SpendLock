import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";

type SubscriptionActionsModalProps = {
  visible: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const SubscriptionActionsModal = ({
  visible,
  subscription,
  onClose,
  onEdit,
  onDelete,
}: SubscriptionActionsModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="modal-overlay">
      <Pressable className="flex-1" onPress={onClose} />
      <View className="modal-container">
        <View className="modal-header">
          <View className="min-w-0 flex-1">
            <Text className="modal-title">Subscription options</Text>
            <Text className="mt-1 text-sm font-sans-medium text-muted-foreground" numberOfLines={1}>
              {subscription?.name ?? "Select a subscription"}
            </Text>
          </View>
          <Pressable className="modal-close" onPress={onClose}>
            <Text className="modal-close-text">X</Text>
          </Pressable>
        </View>

        <View className="gap-3 p-5">
          <Pressable
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
            onPress={onEdit}
          >
            <View className="size-11 items-center justify-center rounded-2xl bg-muted">
              <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-bold text-primary">Edit subscription</Text>
              <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                Update price, payment method, billing, or category.
              </Text>
            </View>
          </Pressable>

          <Pressable
            className="flex-row items-center gap-3 rounded-2xl border border-destructive/20 bg-card p-4"
            onPress={onDelete}
          >
            <View className="size-11 items-center justify-center rounded-2xl bg-destructive/10">
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.destructive} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-bold text-destructive">Delete subscription</Text>
              <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                Remove it from Home, Upcoming, Insights, and Subscriptions.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

export default SubscriptionActionsModal;
