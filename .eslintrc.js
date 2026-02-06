module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  plugins: ['react'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.*'],
      env: { vitest: true, jest: true },
      globals: { test: 'readonly', expect: 'readonly', vi: 'readonly' },
    },
  ],
};