import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    // All plugins are tested as separate projects
    // Each plugin needs its own vitest.config.ts in its directory
    projects: ['packages/@sanity/*', 'plugins/@sanity/*', 'plugins/sanity-plugin-*'],
  },
})
