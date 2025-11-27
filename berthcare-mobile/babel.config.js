module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@screens': './src/screens',
            '@ui': './src/ui',
            '@data': './src/data',
            '@types': './src/types',
            '@assets': './src/assets',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};