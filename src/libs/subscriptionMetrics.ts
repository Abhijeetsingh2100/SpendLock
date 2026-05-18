import dayjs from "dayjs";

export const supportedSpendCurrencies = ["USD", "INR", "EUR", "GBP"] as const;

export type SpendCurrency = (typeof supportedSpendCurrencies)[number];

const currencyPerUsd: Record<SpendCurrency, number> = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79,
};

export const isSpendCurrency = (currency?: string): currency is SpendCurrency =>
  Boolean(currency && supportedSpendCurrencies.includes(currency as SpendCurrency));

export const convertCurrency = (
  amount: number,
  fromCurrency = "USD",
  toCurrency: SpendCurrency = "USD",
) => {
  const safeFromCurrency = isSpendCurrency(fromCurrency) ? fromCurrency : "USD";
  const amountInUsd = amount / currencyPerUsd[safeFromCurrency];

  return amountInUsd * currencyPerUsd[toCurrency];
};

export const getActiveSubscriptions = (subscriptions: Subscription[]) =>
  subscriptions.filter((subscription) => subscription.status !== "cancelled");

export const getMonthlyEquivalent = (subscription: Subscription) => {
  const billing = subscription.billing.toLowerCase();

  if (billing === "yearly") {
    return subscription.price / 12;
  }

  if (billing === "6 months") {
    return subscription.price / 6;
  }

  if (billing === "3 months") {
    return subscription.price / 3;
  }

  return subscription.price;
};

export const getMonthlyTotalByCurrency = (subscriptions: Subscription[]) =>
  getActiveSubscriptions(subscriptions).reduce<Record<string, number>>((totals, subscription) => {
    const currency = subscription.currency ?? "USD";
    totals[currency] = (totals[currency] ?? 0) + getMonthlyEquivalent(subscription);
    return totals;
  }, {});

export const getMonthlyTotalEntries = (subscriptions: Subscription[]) =>
  Object.entries(getMonthlyTotalByCurrency(subscriptions)).sort(([firstCurrency], [secondCurrency]) =>
    firstCurrency.localeCompare(secondCurrency),
  );

export const getMonthlyTotalInCurrency = (
  subscriptions: Subscription[],
  targetCurrency: SpendCurrency,
) =>
  getActiveSubscriptions(subscriptions).reduce((total, subscription) => {
    const monthlyEquivalent = getMonthlyEquivalent(subscription);
    return total + convertCurrency(monthlyEquivalent, subscription.currency, targetCurrency);
  }, 0);

export const getUpcomingSubscriptions = (subscriptions: Subscription[], limit?: number) => {
  const today = dayjs().startOf("day");
  const upcoming = getActiveSubscriptions(subscriptions)
    .filter((subscription) => {
      if (!subscription.renewalDate) return false;
      return dayjs(subscription.renewalDate).isValid();
    })
    .map((subscription) => ({
      subscription,
      daysLeft: Math.max(dayjs(subscription.renewalDate).startOf("day").diff(today, "day"), 0),
    }))
    .filter(({ subscription }) => dayjs(subscription.renewalDate).startOf("day").isAfter(today.subtract(1, "day")))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return typeof limit === "number" ? upcoming.slice(0, limit) : upcoming;
};

export const getTopCategory = (subscriptions: Subscription[]) => {
  const categoryTotals = getActiveSubscriptions(subscriptions).reduce<Record<string, number>>(
    (totals, subscription) => {
      const category = subscription.category ?? "Other";
      totals[category] = (totals[category] ?? 0) + getMonthlyEquivalent(subscription);
      return totals;
    },
    {},
  );

  return Object.entries(categoryTotals).sort((first, second) => second[1] - first[1])[0];
};
