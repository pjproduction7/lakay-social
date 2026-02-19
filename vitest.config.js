import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    testTimeout: 10000,
    exclude: [
      'node_modules/**',
      'server/**/*',
      'dist/**',
    ],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'html', 'json-summary'],
    reportsDirectory: 'coverage',
    thresholds: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
});