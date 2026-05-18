const { getPostHogExpoConfig } = require("posthog-react-native/metro");
const { withNativewind } = require("nativewind/metro");
const path = require("path");
 
/** @type {import('expo/metro-config').MetroConfig} */
const config = getPostHogExpoConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

// Metro can fail to resolve PostHog's bundled @posthog/core internals even
// though the files exist in node_modules. Keep this scoped to PostHog so React
// Native's own package exports keep working normally.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isPostHogCoreBundle = context.originModulePath.includes(
    `${path.sep}@posthog${path.sep}core${path.sep}dist${path.sep}index.js`,
  );

  if (isPostHogCoreBundle && moduleName.startsWith("./logs")) {
    const relativeModulePath =
      moduleName === "./logs" ? "logs/index.js" : moduleName.replace(/^\.\//, "");
    const filePath = path.resolve(
      __dirname,
      "node_modules",
      "@posthog",
      "core",
      "dist",
      relativeModulePath.endsWith(".js")
        ? relativeModulePath
        : `${relativeModulePath}.js`,
    );

    return {
      type: "sourceFile",
      filePath,
    };
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};
 
module.exports = withNativewind(config);
