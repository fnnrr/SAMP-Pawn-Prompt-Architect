const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [];

module.exports = config;
