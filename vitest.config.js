import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    testTimeout: 10000,
    // Exclude native/mobile tests (they use Jest/react-native and cause parse errors in Vite)
    exclude: ['server/**', 'server/**/**', 'node_modules/**'],
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