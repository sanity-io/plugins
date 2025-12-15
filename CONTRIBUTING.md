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

Type checking is [performed by oxlint](https://oxc.rs/blog/2025-12-08-type-aware-alpha.html#support-for-type-checking-while-linting) when running the `lint` command.

### Running All Checks

Before submitting a PR, make sure all checks pass:

```bash
pnpm format
pnpm lint
pnpm build
```

And attach a changeset:

```bash
pnpm changeset add
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

### 2. Init the plugin workspace

Run the generator and follow the prompts:

```bash
pnpm generate "new plugin"
```

You can now iterate on the plugin with hot reloading in the test studio:

```bash
pnpm dev
```

### 3. Create the Initial Release Changeset

The trusted publishing workflow publishes an initial `0.0.1` placeholder version. To publish the real first version, create a changeset:

```bash
pnpm changeset add
```

When prompted:

- Select your new package
- Choose **major** for the version bump (to release `1.0.0`)
- Enter `Initial release` as the summary

Commit the changeset file with your PR.

## Migrate an existing plugin to this monorepo

### 1. Init the plugin workspace

Follow the prompts in the generator:

```bash
pnpm generate "copy plugin"
```

### 2. Manually port over files

Refer to the generated `README.md` file in the plugin workspace for how to complete the last manual steps.

You can run `pnpm dev` to quickly see how the plugin works in the test studio as you migrate code.

### 3. Create a new major release

When moving a plugin to this monorepo the conventions enforced on the repo typically warrant a new major version:

- enabling React Compiler
- Dropping CJS
- Dropping Studio v3 support and requiring at least v4

```bash
pnpm changeset add
```

When prompted:

- Select your new package
- Choose **major** for the version bump
- Enter a summary of the changes that are breaking, and other changes that might affect runtime in order to pass linting and strict type checks.

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
