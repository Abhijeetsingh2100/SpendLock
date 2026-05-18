// app.config.js extends app.json and injects PostHog config from environment variables
const appJson = require('./app.json')

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins || []),
    'expo-localization',
  ],
  extra: {
    posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
    posthogHost: process.env.POSTHOG_HOST,
    "eas": {
          "projectId": "442626bc-996a-4b07-ae14-0d9881ada504"
        }
  },
}
  

