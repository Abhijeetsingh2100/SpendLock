import React, { createContext, useContext, useMemo, useState } from "react";

import { HOME_SUBSCRIPTIONS } from "@/constants/data";

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

export const SubscriptionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);

  const value = useMemo(
    () => ({
      subscriptions,
      addSubscription: (subscription: Subscription) => {
        setSubscriptions((currentSubscriptions) => [subscription, ...currentSubscriptions]);
      },
    }),
    [subscriptions],
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
