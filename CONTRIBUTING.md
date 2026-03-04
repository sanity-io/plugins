# Contributing to Sanity Plugins

Thank you for your interest in contributing to the Sanity Plugins monorepo! This guide will help you get set up and explain our workflows.

> **For AI Agents:** See [AGENTS.md](./AGENTS.md) for agent-specific instructions and quick reference commands.

## Table of Contents

- [Development Setup](#development-setup)
- [Running the Test Studio](#running-the-test-studio)
- [Code Quality](#code-quality)
- [Adding a New Plugin](#adding-a-new-plugin)
- [Publishing Packages](#publishing-packages)
- [Commit Guidelines](#commit-guidelines)

## Development Setup

### Prerequisites

- Node.js (latest LTS)
- [pnpm](https://pnpm.io/) v10 or later — the exact version is managed via `packageManager` in root `package.json`

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

This starts the Sanity Studio dev server at `http://localhost:3333`. The studio is pre-configured with all plugins and includes example schemas to test plugin functionality.

> **Note:** The test studio requires **Sanity user authentication** in the browser. When you access the studio, you'll need to log in with your Sanity account. Simply accessing the URL isn't enough—the studio connects to Sanity APIs and requires authenticated access to the configured project.

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

We use [oxlint](https://oxc.rs/docs/linter.html) for all linting (including React Compiler rules via the react-hooks-js plugin):

```bash
# Run the linter
pnpm lint
```

### Type Checking

Type checking is [performed by oxlint](https://oxc.rs/blog/2025-12-08-type-aware-alpha.html#support-for-type-checking-while-linting) when running the `lint` command.

### Testing

The monorepo uses [Vitest v4](https://vitest.dev) for testing.

```bash
# Run all tests (non-watch mode)
pnpm test run

# Run tests in watch mode (default vitest behavior)
pnpm test

# Update snapshots
pnpm test -u
```

Tests are co-located with source code in the `src/` directory using `.test.ts` or `.spec.ts` extensions. Each plugin includes a package exports test to verify all exports are valid. Tests run from the root and require packages to be built first.

When creating a new plugin with `pnpm generate`, test files and configuration are automatically created. The root `vitest.config.ts` uses glob patterns to automatically discover all plugins, so no manual test configuration is needed when adding new plugins.

#### Test Timeouts

When tests need custom timeouts, use the options object syntax as the second argument:

```ts
// Correct
test('my test', {timeout: 30_000}, async () => {
  // ...
})

// Wrong (deprecated)
test('my test', async () => {}, 30000)
```

### Running All Checks

Before submitting a PR, make sure all checks pass:

```bash
pnpm format
pnpm lint
pnpm build
pnpm test
```

And attach a changeset:

```bash
pnpm changeset add
```

## Adding a New Plugin

### 1. Set Up Trusted Publishing

Trusted publishing configuration depends on whether the package is **brand new** (never published to npm) or **already exists** on npm.

#### For Brand New Packages (Not Yet on npm)

If you're creating a package that has never been published to npm before:

1. Go to the repository's **Actions** tab on GitHub
2. Find the **"Setup a new npm package with Trusted Publishing"** workflow
3. Click **"Run workflow"**
4. Enter the package name (e.g., `@sanity/my-new-plugin` or `sanity-plugin-my-feature`)
5. Enter your **npm OTP code** to automatically configure trusted publishing
6. Click **"Run workflow"** — the workflow will create the package on npm and configure trusted publishing

If you didn't provide an OTP, or the workflow couldn't configure trusted publishing automatically, run this command locally (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github <package-name> --file=release.yml --repository=sanity-io/plugins
```

This sets up [OIDC-based trusted publishing](https://docs.npmjs.com/generating-provenance-statements) so the release workflow can publish packages without storing npm tokens.

#### For Existing Packages (Already on npm)

⚠️ **Do NOT use the "Setup a new npm package with Trusted Publishing" workflow for existing packages!** That workflow is only for brand new packages that don't have an npm settings page yet.

For packages that are already published to npm, configure trusted publishing using the npm CLI (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github <package-name> --file=release.yml --repository=sanity-io/plugins
```

<details>
<summary>Alternative: Configure via npm website</summary>

If you don't have npm >= 11.10.0, you can configure trusted publishing manually:

1. Go to your package's access settings page: `https://www.npmjs.com/package/YOUR-PACKAGE-NAME/access`
2. Under **"Publishing access"**, click **"Add a trusted publisher"** and select **"GitHub Actions"**
3. Fill in the fields **exactly** as shown:

| Setting              | Value           |
| -------------------- | --------------- |
| **Owner**            | `sanity-io`     |
| **Repository**       | `plugins`       |
| **Workflow**         | `release.yml`   |
| **Environment name** | _(leave empty)_ |

4. Click **"Add trusted publisher"**

</details>

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

### 1. Set Up Trusted Publishing

Since the plugin is already published to npm, configure trusted publishing using the npm CLI (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github <package-name> --file=release.yml --repository=sanity-io/plugins
```

See [For Existing Packages](#for-existing-packages-already-on-npm) above for alternative manual instructions.

### 2. Init the plugin workspace

Follow the prompts in the generator:

```bash
pnpm generate "copy plugin"
```

The generator will:

- Fetch metadata from the published npm package
- Copy over `version`, `description`, and `keywords`
- Copy over `dependencies`, automatically filtering out:
  - `@sanity/incompatible-plugin` (test package)
  - `styled-components` (should always be a peer dependency)
  - `sanity` (should always be a peer/dev dependency)
- Detect if the plugin uses `styled-components` based on `devDependencies` and `peerDependencies`

**Note:** You'll need to manually review and copy over any relevant `peerDependencies` and `devDependencies` as needed.

### 3. Manually port over files

Refer to the generated `README.md` file in the plugin workspace for how to complete the last manual steps.

You can run `pnpm dev` to quickly see how the plugin works in the test studio as you migrate code.

### 4. Create a new major release

When moving a plugin to this monorepo the conventions enforced on the repo typically warrant a new major version:

- enabling React Compiler
- Dropping CJS
- Requiring Sanity Studio v5 as the baseline

```bash
pnpm changeset add
```

When prompted:

- Select your new package
- Choose **major** for the version bump
- Enter a summary of the changes that are breaking, and other changes that might affect runtime in order to pass linting and strict type checks.

Commit the changeset file with your PR.

### 5. Update the original repository

After the plugin has been successfully migrated and published from the monorepo, update the original repository to inform users about the move:

1. **Update the README** in the original repository to include a notice at the top:

   ```markdown
   > **Note:** This repository has been moved to the [sanity-io/plugins](https://github.com/sanity-io/plugins) monorepo.
   >
   > All future development, issues, and releases will be managed there.
   >
   > - New location: `plugins/PLUGIN-NAME` (e.g., `plugins/@sanity/document-internationalization`)
   > - npm package: The package name remains the same
   > - Issues: Please open new issues in the [monorepo](https://github.com/sanity-io/plugins/issues)
   ```

2. **Migrate existing issues** to the monorepo:
   - Review all open issues in the original repository
   - Add a label matching the plugin name to each issue for organization (example: an issue that was once in the `@sanity/color-input` repo will have a tag `color-input` in this repo)
   - Move the issues to the monorepo's issue tracker
   - Update issue references as needed

3. **Archive the repository**: Archive the original repository on GitHub to prevent new issues and PRs while keeping the history accessible.

See [this example PR](https://github.com/sanity-io/document-internationalization/pull/214) for reference.

## Publishing Packages

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

### Preview Packages in a PR (`pkg-pr-new`)

You can publish preview versions of changed plugin packages directly from a PR using [`pkg.pr.new`](https://pkg.pr.new).

#### How it is triggered

The preview workflow runs on PR events **only when the PR has the `trigger: preview` label**.

1. Open your PR
2. Add the `trigger: preview` label
3. Wait for the `Publish` workflow (`.github/workflows/pkg-pr-new.yml`) to finish

#### What gets preview-published

The workflow detects changed packages from `.changeset/*.md` files in your PR diff and publishes only matching plugin packages.

- It ignores `.changeset/README.md`
- It supports package names that map to:
  - `@sanity/*` -> `plugins/@sanity/*`
  - `sanity-plugin-*` -> `plugins/sanity-plugin-*`

If no valid changesets are found, no packages are published.

#### How to use the preview

After the workflow runs, it posts (or updates) a PR comment titled **"Preview this PR with pkg.pr.new"** that includes install commands for each published package (for both `pnpm` and `npm`).

Use the provided command in another project to test the preview package version, for example:

```bash
pnpm install <pkg.pr.new url from the PR comment>
```

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
