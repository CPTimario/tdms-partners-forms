module.exports = {
  plugins: ['filenames'],
  overrides: [
    {
      files: ['components/**/*.{ts,tsx}'],
      rules: {
        'filenames/match-regex': [2, '^[A-Z][A-Za-z0-9]+$', true],
      },
    },
  ],
};
