import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15_000,
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
