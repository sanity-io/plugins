import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
