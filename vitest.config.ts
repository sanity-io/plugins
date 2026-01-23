import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['plugins/**/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', 'dist', '.sanity', 'coverage'],
  },
})
