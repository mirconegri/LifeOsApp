// metro.config.js
//
// firebase/auth's package.json "exports" field is not yet fully
// compatible with Metro's ES Module resolution, enabled by default since
// RN 0.79 / Expo SDK 53. Without this override, importing firebase/auth
// compiles fine but fails at runtime.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
