import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { SpendCurrency } from "@/src/libs/subscriptionMetrics";
import { syncRenewalNotifications } from "@/src/libs/subscriptionNotifications";

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  monthlySpendCurrency: SpendCurrency;
  setMonthlySpendCurrency: (currency: SpendCurrency) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subscription: Subscription) => void;
  deleteSubscription: (subscriptionId: string) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

export const SubscriptionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlySpendCurrency, setMonthlySpendCurrency] = useState<SpendCurrency>("USD");
  const scheduledNotificationIds = useRef<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    syncRenewalNotifications(subscriptions, scheduledNotificationIds.current)
      .then((notificationIds) => {
        if (isMounted) {
          scheduledNotificationIds.current = notificationIds;
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [subscriptions]);

  const value = useMemo(
    () => ({
      subscriptions,
      monthlySpendCurrency,
      setMonthlySpendCurrency,
      addSubscription: (subscription: Subscription) => {
        setSubscriptions((currentSubscriptions) => [subscription, ...currentSubscriptions]);
      },
      updateSubscription: (subscription: Subscription) => {
        setSubscriptions((currentSubscriptions) =>
          currentSubscriptions.map((currentSubscription) =>
            currentSubscription.id === subscription.id ? subscription : currentSubscription,
          ),
        );
      },
      deleteSubscription: (subscriptionId: string) => {
        setSubscriptions((currentSubscriptions) =>
          currentSubscriptions.filter((subscription) => subscription.id !== subscriptionId),
        );
      },
    }),
    [monthlySpendCurrency, subscriptions],
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionsContext);

  if (!context) {
    throw new Error("useSubscriptions must be used within SubscriptionsProvider");
  }

  return context;
};
