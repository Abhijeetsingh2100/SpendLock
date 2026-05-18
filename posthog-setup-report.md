<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into SpendLock. The integration covers the full user lifecycle — from sign-up through daily subscription usage to sign-out — and wires up screen tracking, user identification, event capture, and error resilience.

**Summary of changes:**

- **`app.config.js`** (new): Dynamic Expo config that reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from environment variables and exposes them as `Constants.expoConfig.extra`. Also adds the required `expo-localization` plugin.
- **`src/config/posthog.ts`** (new): Initialises the PostHog client via `expo-constants`. Gracefully disables PostHog when the token is missing, with a console warning in development.
- **`app/_layout.tsx`**: Wraps the app with `PostHogProvider` (autocapture + touch events enabled, manual screen tracking). Adds `usePathname` / `useGlobalSearchParams` + `useEffect` to call `posthog.screen()` on every route change.
- **`app/(auth)/sign-in.tsx`**: Calls `posthog.identify()` and captures `user_signed_in` on successful login; captures `sign_in_failed` with reason on error.
- **`app/(auth)/sign-up.tsx`**: Calls `posthog.identify()` and captures `user_signed_up` (with name + signup_date) on successful registration; captures `sign_up_failed` with reason on error.
- **`app/(tabs)/settings.tsx`**: Captures `user_signed_out` and calls `posthog.reset()` before Clerk signs the user out.
- **`app/(tabs)/index.tsx`**: Captures `subscription_card_expanded` / `subscription_card_collapsed` with `subscription_id` and `subscription_name` on every card press.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User created a new account and completed email verification | `app/(auth)/sign-up.tsx` |
| `user_signed_in` | User signed in to their existing account | `app/(auth)/sign-in.tsx` |
| `sign_in_failed` | User attempted sign-in but encountered an error | `app/(auth)/sign-in.tsx` |
| `sign_up_failed` | User attempted account creation but encountered an error | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | User signed out of the app | `app/(tabs)/settings.tsx` |
| `subscription_card_expanded` | User expanded a subscription card to view details | `app/(tabs)/index.tsx` |
| `subscription_card_collapsed` | User collapsed a subscription card | `app/(tabs)/index.tsx` |

## Next steps

We've built a dashboard and insights to monitor user behaviour as events start flowing in:

- [Analytics basics dashboard](/dashboard/1598106)
- [Sign-ups over time](/insights/d5BmUDGZ)
- [Sign-ins over time](/insights/MEeYul0e)
- [Sign-up to Sign-in Conversion Funnel](/insights/sZg9ifJp)
- [Authentication Failures](/insights/bXOigYQs)
- [Subscription Card Interactions](/insights/wh8tS9tH)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
