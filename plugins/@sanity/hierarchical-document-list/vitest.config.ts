import {defineConfig} from 'vitest/config'

export default defineConfig({
  resolve: {
    // Studio runs the browser build. Vitest otherwise resolves the server
    // build, which never injects client styles, so style-count tests would
    // pass without observing the bug.
    alias: {
      'styled-components': 'styled-components/dist/styled-components.browser.esm.js',
    },
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['vitest-package-exports', 'styled-components'],
      },
    },
  },
})
