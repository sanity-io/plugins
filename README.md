# Sanity Plugins Monorepo

This monorepo is the home for Sanity Studio plugins maintained by Sanity staff and the community. It provides a centralized place for developing, testing, and publishing plugins that extend Sanity Studio's functionality.

## Repository Structure

```
.
├── plugins/           # Sanity Studio plugins
├── packages/          # Shared packages and utilities
│   └── @repo/          # Internal monorepo utilities (not published)
└── dev/
    └── test-studio    # Local Sanity Studio for testing plugins
```

### Plugins ([`./plugins`](./plugins))

This is where all Sanity Studio plugins live.

### Packages ([`./packages`](./packages))

The packages folder contains two types of packages:

1. **Published utilities** - Helpful libraries used by plugins that are published to npm
2. **Internal packages** (`@repo/*`) - Shared configurations for tooling (TypeScript, ESLint, etc.) that are **not** published to npm and are only used within this monorepo

## Getting Started

### Prerequisites

- Node.js (latest LTS)
- [pnpm](https://pnpm.io/) v10 or later (managed via corepack)

### Installation

```bash
# Enable corepack for automatic pnpm version management
corepack enable

# Install dependencies
pnpm install
```

### Development

```bash
# Start the test studio for local development
pnpm dev

# Run linting and type checking
pnpm lint

# Build all packages
pnpm build

# Format code (this also runs through a pre-commit git hook)
pnpm format
```

### Inspecting Builds with Vite DevTools

The test studio can run with [Vite DevTools](https://devtools.vite.dev) enabled to inspect what `sanity build` produces: module graph, chunk composition, plugin timings, and bundle treemaps.

```bash
# Build the test studio with devtools enabled, then start the dev server
pnpm devtools:test-studio
```

Open `http://localhost:3333` and use the DevTools dock (or the full-page UI at `http://localhost:3333/__devtools/`) to explore the recorded build session. The first time a browser connects, approve the one-time permission prompt shown in the terminal.

To record a fresh build session after making changes—while the dev server is still running—run in a second terminal:

```bash
pnpm devtools:test-studio:build
```

Sessions can be compared in the DevTools UI to diff bundle changes between builds. DevTools is opt-in (via the `ENABLE_VITE_DEVTOOLS=true` env flag these scripts set) because it makes builds slower and writes large session logs to `dev/test-studio/node_modules/.rolldown`. See [AGENTS.md](./AGENTS.md#inspecting-production-builds-with-vite-devtools) for more details.

## Current Plugins

| Plugin                                                                                                   | Description                                                         |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`@sanity/assist`](./plugins/@sanity/assist)                                                             | AI-powered writing and translation assistance for Studio            |
| [`@sanity/code-input`](./plugins/@sanity/code-input)                                                     | Code editor input powered by CodeMirror                             |
| [`@sanity/color-input`](./plugins/@sanity/color-input)                                                   | Color picker input for Sanity Studio                                |
| [`@sanity/dashboard`](./plugins/@sanity/dashboard)                                                       | Tool for rendering dashboard widgets                                |
| [`@sanity/debug-live-sync-tags`](./plugins/@sanity/debug-live-sync-tags)                                 | Debug tool for inspecting live sync tags                            |
| [`@sanity/debug-preview-url-secret-plugin`](./plugins/@sanity/debug-preview-url-secret-plugin)           | Debug tool for preview URL secrets and their status                 |
| [`@sanity/document-internationalization`](./plugins/@sanity/document-internationalization)               | Document-level translations linked by a shared reference            |
| [`@sanity/form-toolkit`](./plugins/@sanity/form-toolkit)                                                 | Toolkit for integrating forms with a Sanity Studio                  |
| [`@sanity/hierarchical-document-list`](./plugins/@sanity/hierarchical-document-list)                     | Edit and persist hierarchical document trees                        |
| [`@sanity/language-filter`](./plugins/@sanity/language-filter)                                           | Filter localized fields by language                                 |
| [`@sanity/orderable-document-list`](./plugins/@sanity/orderable-document-list)                           | Drag-and-drop document ordering without leaving the editing surface |
| [`@sanity/personalization-plugin`](./plugins/@sanity/personalization-plugin)                             | Field-level personalization and A/B testing experiments             |
| [`@sanity/presets`](./plugins/@sanity/presets)                                                           | Experimental preset patterns for Sanity Studio                      |
| [`@sanity/rich-date-input`](./plugins/@sanity/rich-date-input)                                           | Timezone-aware datetime input for Sanity Studio                     |
| [`@sanity/sanity-plugin-async-list`](./plugins/@sanity/sanity-plugin-async-list)                         | Autocomplete string input with options loaded from an external API  |
| [`@sanity/studio-secrets`](./plugins/@sanity/studio-secrets)                                             | Manage Studio secrets at runtime                                    |
| [`@sanity/table`](./plugins/@sanity/table)                                                               | Table schema type and input component for Sanity Studio             |
| [`@sanity/vercel-protection-bypass`](./plugins/@sanity/vercel-protection-bypass)                         | Setup tool for Vercel Deployment Protection in previews             |
| [`sanity-plugin-aprimo`](./plugins/sanity-plugin-aprimo)                                                 | Aprimo asset selector integration                                   |
| [`sanity-plugin-asset-source-unsplash`](./plugins/sanity-plugin-asset-source-unsplash)                   | Use Unsplash images directly in Sanity Studio                       |
| [`sanity-plugin-bynder-input`](./plugins/sanity-plugin-bynder-input)                                     | Bynder asset picker integration                                     |
| [`sanity-plugin-cloudinary`](./plugins/sanity-plugin-cloudinary)                                         | Cloudinary asset source and schema integration                      |
| [`sanity-plugin-dashboard-widget-document-list`](./plugins/sanity-plugin-dashboard-widget-document-list) | Dashboard widget for displaying document lists                      |
| [`sanity-plugin-dashboard-widget-netlify`](./plugins/sanity-plugin-dashboard-widget-netlify)             | Dashboard widget for triggering Netlify builds                      |
| [`sanity-plugin-dashboard-widget-vercel`](./plugins/sanity-plugin-dashboard-widget-vercel)               | Dashboard widget for managing Vercel deployments                    |
| [`sanity-plugin-documents-pane`](./plugins/sanity-plugin-documents-pane)                                 | Display GROQ-queried document lists in a view pane                  |
| [`sanity-plugin-graph-view`](./plugins/sanity-plugin-graph-view)                                         | Visual graph tool for exploring content relationships               |
| [`sanity-plugin-hotspot-array`](./plugins/sanity-plugin-hotspot-array)                                   | Add and update array items by clicking on an image                  |
| [`sanity-plugin-iframe-pane`](./plugins/sanity-plugin-iframe-pane)                                       | Display external URLs in a Studio pane                              |
| [`sanity-plugin-internationalized-array`](./plugins/sanity-plugin-internationalized-array)               | Store localized fields in arrays to save attributes                 |
| [`sanity-plugin-latex-input`](./plugins/sanity-plugin-latex-input)                                       | LaTeX input for Portable Text Editor                                |
| [`sanity-plugin-markdown`](./plugins/sanity-plugin-markdown)                                             | Markdown editor input                                               |
| [`sanity-plugin-media`](./plugins/sanity-plugin-media)                                                   | Asset management with tagging, filtering and batch operations       |
| [`sanity-plugin-mux-input`](./plugins/sanity-plugin-mux-input)                                           | Upload and play Mux-hosted video from Sanity Studio                 |
| [`sanity-plugin-shopify-assets`](./plugins/sanity-plugin-shopify-assets)                                 | Choose assets from your Shopify store in your Sanity Studio         |
| [`sanity-plugin-studio-smartling`](./plugins/sanity-plugin-studio-smartling)                             | In-studio integration with Smartling for content translation        |
| [`sanity-plugin-transifex`](./plugins/sanity-plugin-transifex)                                           | In-studio integration with Transifex for content translation        |
| [`sanity-naive-html-serializer`](./plugins/sanity-naive-html-serializer)                                 | Serialize Sanity documents and rich text fields to HTML             |
| [`sanity-plugin-utils`](./plugins/sanity-plugin-utils)                                                   | Handy hooks and components for Sanity Studio plugins                |
| [`sanity-translations-tab`](./plugins/sanity-translations-tab)                                           | Base module for translation vendor integrations in Studio           |
| [`sanity-plugin-workflow`](./plugins/sanity-plugin-workflow)                                             | Custom content publishing workflow example                          |
| [`sanity-plugin-workspace-home`](./plugins/sanity-plugin-workspace-home)                                 | Home screen for multi-workspace studios                             |

## Tooling Packages

| Package                                               | Description                                             |
| ----------------------------------------------------- | ------------------------------------------------------- |
| [`@sanity/plugin-kit`](./packages/@sanity/plugin-kit) | CLI toolkit for developing and verifying Sanity plugins |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- [Development Setup](./CONTRIBUTING.md#development-setup)
- [Running the Test Studio](./CONTRIBUTING.md#running-the-test-studio)
- [Code Quality](./CONTRIBUTING.md#code-quality)
- [Adding a New Plugin](./CONTRIBUTING.md#adding-a-new-plugin)
- [Migrating an Existing Plugin](./CONTRIBUTING.md#migrate-an-existing-plugin-to-this-monorepo)
- [Publishing Packages](./CONTRIBUTING.md#publishing-packages)

## License

MIT © [Sanity.io](https://www.sanity.io/)
