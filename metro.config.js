const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
  // Prevent Metro from traversing sibling git worktrees that may contain
  // another React install (can trigger "Invalid hook call").
  blockList: exclusionList([
    new RegExp(`${path.resolve(__dirname, "..", "Lynk.worktrees").replace(/[/\\]/g, "[/\\\\]")}.*`),
  ]),
};

module.exports = config;