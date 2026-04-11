// Same as nativewind/babel (react-native-css-interop preset) but without
// react-native-worklets/plugin — that targets Reanimated 4+ and is not installed on Expo 51
// (RN 0.74) with react-native-reanimated ~3.10. Reanimated's Babel plugin stays last below.
function nativewindCssInteropReanimated3Preset() {
  return {
    plugins: [
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
    ],
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {jsxImportSource: 'nativewind'}],
      nativewindCssInteropReanimated3Preset,
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@config': './config',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

