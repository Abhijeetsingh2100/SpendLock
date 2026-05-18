import dayjs from "dayjs";
import { clsx } from "clsx";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@/constants/theme";
import { resolveSubscriptionIcon } from "@/src/libs/subscriptionIconResolver";

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

type Frequency = "Monthly" | "Yearly";
type CurrencyCode = "USD" | "INR" | "EUR" | "GBP";

const categories = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
];

const currencies: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "Dollar" },
  { code: "INR", label: "Rupee" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "Pound" },
];

const categoryColors: Record<string, string> = {
  Entertainment: "#ffd6a5",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#c7e7f5",
  Music: "#f7c8d0",
  Other: "#f6eecf",
};

const CreateSubscriptionModal = ({ visible, onClose, onCreate }: CreateSubscriptionModalProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState("Entertainment");
  const [error, setError] = useState("");

  const parsedPrice = Number(price.trim());
  const canSubmit = useMemo(
    () => name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0,
    [name, parsedPrice],
  );

  const resetForm = () => {
    setName("");
    setPrice("");
    setCurrency("USD");
    setFrequency("Monthly");
    setCategory("Entertainment");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const amount = Number(price.trim());

    if (!trimmedName) {
      setError("Enter a subscription name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a positive price.");
      return;
    }

    const startDate = dayjs();
    const renewalDate =
      frequency === "Monthly" ? startDate.add(1, "month") : startDate.add(1, "year");
    const resolvedIcon = resolveSubscriptionIcon(trimmedName, category);

    onCreate({
      id: `subscription-${Date.now()}`,
      name: trimmedName,
      price: amount,
      frequency,
      category,
      status: "active",
      startDate: startDate.toISOString(),
      renewalDate: renewalDate.toISOString(),
      icon: resolvedIcon.icon,
      iconGlyph: resolvedIcon.iconGlyph,
      billing: frequency,
      color: categoryColors[category] ?? categoryColors.Other,
      currency,
      plan: frequency === "Monthly" ? "Monthly Plan" : "Yearly Plan",
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="modal-overlay">
          <Pressable className="flex-1" onPress={handleClose} />

          <View className="modal-container">
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">X</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerClassName="modal-body"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className="auth-input"
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    setError("");
                  }}
                  placeholder="Netflix, ChatGPT, Figma..."
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className="auth-input"
                  value={price}
                  onChangeText={(value) => {
                    setPrice(value);
                    setError("");
                  }}
                  placeholder="9.99"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Currency</Text>
                <View className="category-scroll">
                  {currencies.map((option) => {
                    const isActive = currency === option.code;

                    return (
                      <Pressable
                        key={option.code}
                        className={clsx("category-chip", isActive && "category-chip-active")}
                        onPress={() => setCurrency(option.code)}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            isActive && "category-chip-text-active",
                          )}
                        >
                          {option.label} ({option.code})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as Frequency[]).map((option) => {
                    const isActive = frequency === option;

                    return (
                      <Pressable
                        key={option}
                        className={clsx("picker-option", isActive && "picker-option-active")}
                        onPress={() => setFrequency(option)}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            isActive && "picker-option-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {categories.map((option) => {
                    const isActive = category === option;

                    return (
                      <Pressable
                        key={option}
                        className={clsx("category-chip", isActive && "category-chip-active")}
                        onPress={() => setCategory(option)}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            isActive && "category-chip-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {error ? <Text className="auth-error">{error}</Text> : null}

              <Pressable
                className={clsx("auth-button", !canSubmit && "auth-button-disabled")}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text className="auth-button-text">Create subscription</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
