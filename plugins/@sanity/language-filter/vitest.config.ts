import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
