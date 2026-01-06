# @sanity/debug-preview-url-secret-plugin

[![npm stat](https://img.shields.io/npm/dm/@sanity/debug-preview-url-secret-plugin.svg?style=flat-square)](https://npm-stat.com/charts.html?package=@sanity/debug-preview-url-secret-plugin)
[![npm version](https://img.shields.io/npm/v/@sanity/debug-preview-url-secret-plugin.svg?style=flat-square)](https://www.npmjs.com/package/@sanity/debug-preview-url-secret-plugin)

```sh
npm install @sanity/debug-preview-url-secret-plugin
```

This package is used together with [`sanity/presentation`] to debug URL preview secrets and their status.

Add the plugin to your `sanity.config.ts`:

```ts
// ./sanity.config.ts
import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'

export default defineConfig({
  // ... other options
  plugins: [
    // ... other plugins
    structureTool(),
    presentationTool({
      previewUrl: {
        // @TODO change to the URL of the application, or `location.origin` if it's an embedded Studio
        origin: 'http://localhost:3000',
        previewMode: {
          enable: '/api/draft',
        },
      },
    }),
    debugSecrets(),
  ],
})
```

You should see a new `@sanity/preview-url-secret` type in Structure Tool, which lists out secrets with metadata about when they were created and in what context.

[`sanity/presentation`]: https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool
