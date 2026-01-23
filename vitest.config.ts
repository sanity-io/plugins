import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'plugins/@sanity/code-input',
      'plugins/@sanity/color-input',
      'plugins/@sanity/debug-preview-url-secret-plugin',
      'plugins/@sanity/rich-date-input',
      'plugins/@sanity/vercel-protection-bypass',
      'plugins/sanity-plugin-aprimo',
      'plugins/sanity-plugin-asset-source-unsplash',
      'plugins/sanity-plugin-bynder-input',
      'plugins/sanity-plugin-graph-view',
      'plugins/sanity-plugin-iframe-pane',
      'plugins/sanity-plugin-markdown',
      'plugins/sanity-plugin-workflow',
      'plugins/sanity-plugin-workspace-home',
    ],
  },
})
