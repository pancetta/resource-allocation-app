import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['js/**/*.js'],
      exclude: ['js/bundle.js'],
      // Coverage thresholds to prevent regression
      thresholds: {
        statements: 75,
        branches: 80,
        functions: 70,
        lines: 75
      }
    }
  }
});
