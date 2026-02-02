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
      exclude: [
        'js/bundle.js',
        // New UX infrastructure modules - tests pending (Phase 2)
        'js/ui/toast.js',
        'js/ui/enhancements.js',
        'js/helpers/undoManager.js',
        'js/helpers/loadingState.js',
        'js/helpers/tableHelpers.js',
        'js/helpers/smartDefaults.js',
        'js/views/timelineView.js'
      ],
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
