# Contributing to Sanity Plugins

Thank you for your interest in contributing to the Sanity Plugins monorepo! This guide will help you get set up and explain our workflows.

## Table of Contents

- [Development Setup](#development-setup)
- [Running the Test Studio](#running-the-test-studio)
- [Code Quality](#code-quality)
- [Adding a New Plugin](#adding-a-new-plugin)
- [Publishing Packages](#publishing-packages)
- [Commit Guidelines](#commit-guidelines)

## Development Setup

### Prerequisites

- Node.js `>=20.19 <22 || >=22.12`
- [pnpm](https://pnpm.io/) (we use corepack for version management)

### Initial Setup

```bash
# Enable corepack to automatically use the correct pnpm version
corepack enable

# Install all dependencies
pnpm install

# Build all packages (required before running the test studio)
pnpm build
```

## Running the Test Studio

The test studio located at `dev/test-studio` is a Sanity Studio instance that includes all plugins from this monorepo. It's the primary way to develop and test plugins locally.

```bash
# Start the test studio in development mode
pnpm dev
```

This will start the Sanity Studio dev server. The studio is pre-configured with all plugins and includes example schemas to test plugin functionality.

The studio is deployed in two places:

- https://plugins.sanity.studio - deployed on merges to main
- https://plugins-studio.sanity.dev - also deployed on merges to main, and creates vercel preview deployments on PRs

### Adding Your Plugin to the Test Studio

1. Add your plugin as a dependency in `dev/test-studio/package.json`:

```json
{
  "dependencies": {
    "your-plugin-name": "workspace:*"
  }
}
```

2. Import and configure your plugin in `dev/test-studio/sanity.config.ts`

3. If your plugin requires schema types, add them to the appropriate schema file in `dev/test-studio/src/`

## Code Quality

### Formatting

We use [oxfmt](https://oxc.rs/docs/formatter.html) for code formatting:

```bash
# Format all files
pnpm format
```

### Linting

We use a combination of [oxlint](https://oxc.rs/docs/linter.html) and [ESLint](https://eslint.org/) (for React Compiler rules):

```bash
# Run all linters
pnpm lint

# Run only oxlint
pnpm oxlint
```

### Type Checking

We use TypeScript with [tsgo](https://github.com/nicknisi/tsgo) (native TypeScript) for type checking:

```bash
# Type check all packages
pnpm typecheck
```

### Running All Checks

Before submitting a PR, make sure all checks pass:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm format
```

## Adding a New Plugin

### 1. Set Up Trusted Publishing (for new npm packages)

Before you can publish a new package, you need to configure npm trusted publishing:

1. Go to the repository's **Actions** tab on GitHub
2. Find the **"Setup a new npm package with Trusted Publishing"** workflow
3. Click **"Run workflow"**
4. Enter the package name (e.g., `@sanity/my-new-plugin` or `sanity-plugin-my-feature`)
5. The workflow will create the package on npm and output instructions for configuring trusted publishing

After the workflow completes, go to the package settings on npm and configure trusted publishing with these values:

| Setting       | Value           |
| ------------- | --------------- |
| Organization  | `sanity-io`     |
| Repository    | `plugins`       |
| Workflow name | `release.yml`   |
| Environment   | _(leave blank)_ |

Under token settings, configure:

- **Require 2FA** for publishing
- **Disallow tokens** (granular and automation tokens)

This sets up [OIDC-based trusted publishing](https://docs.npmjs.com/generating-provenance-statements) so the release workflow can publish packages without storing npm tokens.

### 2. Create the Plugin Directory

Create your plugin in the `plugins/` directory:

```bash
mkdir -p plugins/@sanity/my-plugin
# or
mkdir -p plugins/sanity-plugin-my-feature
```

### 3. Required Files

Each plugin needs the following files. Use existing plugins as reference:

#### `package.json`

```json
{
  "name": "@sanity/my-plugin",
  "version": "0.0.1",
  "description": "Description of your plugin",
  "keywords": ["sanity", "sanity-plugin"],
  "homepage": "https://github.com/sanity-io/plugins/tree/main/plugins/@sanity/my-plugin#readme",
  "bugs": {
    "url": "https://github.com/sanity-io/plugins/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/sanity-io/plugins.git",
    "directory": "plugins/@sanity/my-plugin"
  },
  "license": "MIT",
  "author": "Sanity.io <hello@sanity.io>",
  "type": "module",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "pkg build --strict --check --clean",
    "lint": "eslint .",
    "prepack": "turbo run build",
    "typecheck": "(cd ../../.. && tsgo --project plugins/@sanity/my-plugin/tsconfig.json)"
  },
  "dependencies": {
    "react-compiler-runtime": "^1.0.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/package.config": "workspace:*",
    "@repo/tsconfig": "workspace:*",
    "@sanity/pkg-utils": "catalog:",
    "@types/react": "catalog:",
    "@typescript/native-preview": "catalog:",
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint": "catalog:",
    "react": "catalog:",
    "sanity": "catalog:",
    "styled-components": "catalog:",
    "typescript": "catalog:"
  },
  "peerDependencies": {
    "react": "^18.3 || ^19",
    "sanity": "^4",
    "styled-components": "^6.1"
  },
  "engines": {
    "node": ">=20.19 <22 || >=22.12"
  },
  "publishConfig": {
    "exports": {
      ".": "./dist/index.js",
      "./package.json": "./package.json"
    }
  }
}
```

> **Note:** Adjust the `typecheck` script path based on your plugin location. For `plugins/@sanity/*` use `../../..`, for `plugins/sanity-plugin-*` use `../..`.

#### `package.config.ts`

```typescript
import config from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...config,
  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '18'},
})
```

#### `tsconfig.json`

```json
{
  "extends": "@repo/tsconfig/check.json",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["dist", "node_modules"]
}
```

#### `tsconfig.build.json`

```json
{
  "extends": "@repo/tsconfig/build.json",
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["dist", "node_modules"]
}
```

#### `eslint.config.js`

```javascript
import baseConfig from '@repo/eslint-config'
import {defineConfig} from 'eslint/config'

export default defineConfig(baseConfig)
```

#### `README.md`

Create a README documenting your plugin's installation and usage.

#### `src/index.ts`

Your plugin's main entry point.

### 4. Install Dependencies

After creating your plugin, run:

```bash
pnpm install
```

### 5. Add to Test Studio

Add your plugin to `dev/test-studio/package.json` and `dev/test-studio/sanity.config.ts` to test it locally.

### 6. Create the Initial Release Changeset

The trusted publishing workflow publishes an initial `0.0.1` placeholder version. To publish the real first version, create a changeset:

```bash
pnpm changeset add
```

When prompted:

- Select your new package
- Choose **major** for the version bump (to release `1.0.0`)
- Enter `Initial release` as the summary

Commit the changeset file with your PR.

## Publishing Packages

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

### Creating a Changeset

When you make changes that should be released:

```bash
pnpm changeset add
```

Follow the prompts to:

1. Select the packages that have changed
2. Choose the version bump type (patch/minor/major)
3. Write a summary of the changes

This creates a changeset file in `.changeset/` that should be committed with your PR.

### Release Process

1. Merge PRs that include changeset files to `main`
2. The release workflow automatically creates a **"Version Packages"** PR that bumps versions and updates changelogs
3. When the "Version Packages" PR is merged, packages are automatically published to npm with provenance

## Commit Guidelines

- Write clear, descriptive commit messages
- Reference relevant issues when applicable
- Keep commits focused on a single change

## Questions?

If you have questions or need help, please:

- Open an issue in this repository
- Join the [Sanity Community Discord](https://snty.link/community)
