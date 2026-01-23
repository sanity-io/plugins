import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for browser globals required by CodeMirror
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.sanity', 'coverage'],
    testTimeout: 30000, // 30 seconds for package export tests
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
