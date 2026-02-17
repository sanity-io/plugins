import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: [],
    deps: {
      inline: ['vitest-package-exports'],
    },
  },
})
