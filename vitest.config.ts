import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    reporters: process.env.GITHUB_ACTIONS === 'true' ? ['default', 'github-actions'] : ['default'],
    // All plugins are tested as separate projects
    // Each plugin needs its own vitest.config.ts in its directory
    projects: [
      'packages/@sanity/*',
      'plugins/@sanity/*',
      'plugins/sanity-plugin-*',
      'plugins/sanity-naive-html-serializer',
      'plugins/sanity-translations-tab',
      'scripts/*',
    ],
  },
})
