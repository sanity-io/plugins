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

- Node.js `>=20.19 <22 || >=22.12`
- [pnpm](https://pnpm.io/) `10.24.0` (managed via corepack)

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

## Current Plugins

| Plugin                                                                                         | Description                                               |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`@sanity/color-input`](./plugins/@sanity/color-input)                                         | Color picker input for Sanity Studio                      |
| [`@sanity/debug-preview-url-secret-plugin`](./plugins/@sanity/debug-preview-url-secret-plugin) | Debug plugin for preview URL secrets                      |
| [`@sanity/vercel-protection-bypass`](./plugins/@sanity/vercel-protection-bypass)               | Tool for bypassing Vercel authentication in preview       |
| [`sanity-plugin-aprimo`](./plugins/sanity-plugin-aprimo)                                       | Aprimo DAM integration                                    |
| [`sanity-plugin-bynder-input`](./plugins/sanity-plugin-bynder-input)                           | Bynder DAM integration                                    |
| [`sanity-plugin-graph-view`](./plugins/sanity-plugin-graph-view)                               | Visual graph view of document references                  |
| [`sanity-plugin-markdown`](./plugins/sanity-plugin-markdown)                                   | Markdown editor input                                     |
| [`sanity-plugin-workflow`](./plugins/sanity-plugin-workflow)                                   | Custom workflow management example for content publishing |
| [`sanity-plugin-workspace-home`](./plugins/sanity-plugin-workspace-home)                       | Workspace home screen customization                       |

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
