const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const {
  withSentryConfig
} = require("@sentry/react-native/metro");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'cjs', 'mjs', 'json'],
  },
  annotateReactComponents: true,
};

module.exports = withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config));