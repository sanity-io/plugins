import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // Building whole themes and comparing every color in them takes several
    // seconds with coverage on, as CI runs pull requests
    testTimeout: 30_000,
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
