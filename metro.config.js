const path = require('path');
// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Explicitly configure the transformer to ensure TypeScript files are transpiled
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Ensure TypeScript extensions are properly resolved
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

// Force Metro to resolve expo-modules-core to its compiled JavaScript output
config.resolver.extraNodeModules = {
  'expo-modules-core': path.resolve(__dirname, 'node_modules/expo-modules-core/build'),
};

module.exports = config;