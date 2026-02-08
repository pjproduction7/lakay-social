import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    testTimeout: 10000,
  },
  coverage: {
    provider: 'c8',
    reporter: ['text', 'lcov', 'html'],
    reportsDirectory: 'coverage',
    statements: 80,
    branches: 70,
    functions: 80,
    lines: 80,
  },
});