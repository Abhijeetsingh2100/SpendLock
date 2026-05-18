import dayjs from "dayjs";
import cancelScheduledNotificationAsync from "expo-notifications/build/cancelScheduledNotificationAsync";
import { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import scheduleNotificationAsync from "expo-notifications/build/scheduleNotificationAsync";
import setNotificationChannelAsync from "expo-notifications/build/setNotificationChannelAsync";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { Platform } from "react-native";

import { formatCurrency } from "@/libs/utils";

const renewalReminderChannelId = "renewal-reminders";

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ensureNotificationPermissions = async () => {
  if (Platform.OS === "web") {
    return false;
  }

  if (Platform.OS === "android") {
    await setNotificationChannelAsync(renewalReminderChannelId, {
      name: "Renewal reminders",
      importance: AndroidImportance.HIGH,
      sound: "default",
    });
  }

  const currentPermissions = await getPermissionsAsync();
  const finalPermissions = currentPermissions.granted
    ? currentPermissions
    : await requestPermissionsAsync();

  return finalPermissions.granted;
};

const getReminderDate = (renewalDate: string) => {
  const renewal = dayjs(renewalDate);

  if (!renewal.isValid() || renewal.isBefore(dayjs())) {
    return null;
  }

  const threeDaysBefore = renewal.subtract(3, "day").hour(9).minute(0).second(0).millisecond(0);

  if (threeDaysBefore.isAfter(dayjs())) {
    return threeDaysBefore.toDate();
  }

  if (renewal.diff(dayjs(), "day", true) <= 3) {
    return dayjs().add(5, "second").toDate();
  }

  return null;
};

export const syncRenewalNotifications = async (
  subscriptions: Subscription[],
  existingNotificationIds: string[],
) => {
  if (Platform.OS === "web") {
    return [];
  }

  await Promise.all(
    existingNotificationIds.map((notificationId) =>
      cancelScheduledNotificationAsync(notificationId).catch(() => undefined),
    ),
  );

  const hasPermission = await ensureNotificationPermissions();

  if (!hasPermission) {
    return [];
  }

  const notificationIds: string[] = [];

  for (const subscription of subscriptions) {
    if (subscription.status === "cancelled" || !subscription.renewalDate) {
      continue;
    }

    const reminderDate = getReminderDate(subscription.renewalDate);

    if (!reminderDate) {
      continue;
    }

    const notificationId = await scheduleNotificationAsync({
      content: {
        title: `${subscription.name} renews soon`,
        body: `${formatCurrency(subscription.price, subscription.currency)} ${subscription.billing.toLowerCase()} renewal is coming up.`,
        data: {
          subscriptionId: subscription.id,
          renewalDate: subscription.renewalDate,
        },
        sound: "default",
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: renewalReminderChannelId,
      },
    });

    notificationIds.push(notificationId);
  }

  return notificationIds;
};
