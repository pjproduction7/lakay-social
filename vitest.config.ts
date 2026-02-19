import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // Use the V8 coverage provider
      reporter: ['text', 'lcov'], // Generate lcov reports
      reportsDirectory: './coverage', // Ensure reports are saved in ./coverage
    },
  },
});