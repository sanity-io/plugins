import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: [],
  },
  server: {
    deps: {
      inline: ['vitest-package-exports'],
    },
  },
})
