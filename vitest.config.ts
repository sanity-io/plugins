import {defineConfig} from 'vitest/config'

/**
 * Shared Vitest configuration for the monorepo.
 * Individual workspaces can extend this by creating their own vitest.config.ts
 * that imports and extends this config.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Use glob patterns to find tests co-located with source code
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Exclude common non-test directories
    exclude: ['node_modules', 'dist', '.sanity', 'coverage'],
  },
})
