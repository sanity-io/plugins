# Agent Guide for Sanity Plugins Monorepo

This guide is for AI agents working on this codebase. Follow these instructions to ensure successful contributions.

> **Self-Improvement:** If you discover undocumented requirements, commands, or workflows during your work (e.g., a reviewer asks you to run something not covered here), update this file on the same PR. Keep this guide accurate and helpful for future agents.

## Quick Reference

| Task                 | Command                  |
| -------------------- | ------------------------ |
| Install dependencies | `pnpm install`           |
| Format code          | `pnpm format`            |
| Run linters          | `pnpm lint`              |
| Build all packages   | `pnpm build`             |
| Run tests            | `pnpm --if-present test` |
| Add changeset        | `pnpm changeset add`     |
| Start dev server     | `pnpm dev`               |

## Environment Setup

### Node.js Version

Use Node.js **v24** (latest LTS). The engines field in packages specifies `>=20.19 <22 || >=22.12`, but the test studio targets Node 24.

### pnpm Version

The exact pnpm version is managed via the `packageManager` field in root `package.json`. You only need pnpm **v10 or later** installed globally—corepack or pnpm itself will auto-install the exact version specified (currently `pnpm@10.28.1`).

```bash
# Enable corepack to automatically use the correct pnpm version
corepack enable

# Install all dependencies
pnpm install
```

## Before Submitting a PR

Run these commands in order. **All must pass** or CI will fail:

```bash
# 1. Format code (oxfmt)
pnpm format

# 2. Run linters (oxlint + ESLint for React Compiler rules)
pnpm lint

# 3. Build all packages
pnpm build

# 4. Run tests (if any exist)
pnpm --if-present test
```

### Required: Add a Changeset

Every PR that changes published packages **must** include a changeset:

```bash
pnpm changeset add
```

Follow the prompts to:

1. Select the packages that changed
2. Choose the version bump type (patch/minor/major)
3. Write a summary of the changes

This creates a file in `.changeset/` that must be committed with your PR.

## CI Checks

The CI pipeline runs on every PR:

| Job       | What it checks                                                                 |
| --------- | ------------------------------------------------------------------------------ |
| **build** | `pnpm build` - All packages compile successfully                               |
| **lint**  | `pnpm oxlint --format github` + `pnpm lint:ci` - Code passes oxlint and ESLint |
| **test**  | `pnpm --if-present test` - All tests pass (runs after build + lint)            |

### Lint Specifics

- **oxlint**: Type-aware linting with `--deny-warnings` (warnings are errors)
- **TypeScript type checking** is included in `pnpm lint` (via oxlint's `--type-check --type-aware` flags) — no separate `tsc` needed
- **ESLint**: React Compiler rules only
- Run `pnpm lint:fix` to auto-fix issues when possible

## Pull Request Workflow

### 1. Create as Draft PR First

Always open PRs as **draft** initially. The prompter (person who requested the work) reviews first before marking ready for team review.

### 2. Move Out of Draft

Once the prompter approves, convert from draft to ready-for-review so the team can review.

### 3. Merge Process

After approval, PRs merge to `main`. The release workflow automatically:

1. Creates a "Version Packages" PR that bumps versions
2. When that PR merges, packages publish to npm with provenance

## Development Server

### Starting the Test Studio

```bash
pnpm dev
```

This starts the Sanity Studio at `http://localhost:3333`.

### ⚠️ Authentication Required

The test studio is a real Sanity Studio that connects to Sanity APIs. You must:

1. Have a Sanity account
2. **Log in via the browser** when prompted
3. Have access to the configured project (`ppsg7ml5` by default)

Simply accessing `http://localhost:3333` is not enough—the studio requires browser-based Sanity authentication to function.

## Creating a New Plugin

Use the generator:

```bash
pnpm generate "new plugin"
```

Or to migrate an existing plugin:

```bash
pnpm generate "copy plugin"
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed instructions on:

- Setting up npm trusted publishing
- Creating initial release changesets
- Migrating existing plugins

## Code Style

### Formatting

We use [oxfmt](https://oxc.rs/docs/formatter.html):

```bash
pnpm format
```

### Linting

We use [oxlint](https://oxc.rs/docs/linter.html) (type-aware, includes TypeScript type checking) + ESLint (React Compiler rules):

```bash
pnpm lint        # Run all linters (includes type checking)
pnpm lint:fix    # Auto-fix what's possible
```

## Project Structure

```
plugins/
├── dev/test-studio/      # Test Sanity Studio (localhost:3333)
├── packages/@repo/       # Internal shared packages
├── plugins/              # Published plugins
│   ├── @sanity/          # @sanity/* scoped packages
│   └── sanity-plugin-*   # Community-style packages
├── turbo/generators/     # Plugin scaffolding templates
└── .changeset/           # Changeset files for releases
```

## Common Issues

### Lint Errors About Missing Types

Run `pnpm build` first—some packages need to be built for type information to be available.

### "Command not found: pnpm"

Ensure you have pnpm v10+ installed, then run:

```bash
corepack enable
```

### Test Studio Won't Load

1. Check you're logged into Sanity in the browser
2. Verify you have access to the project
3. Check the browser console for specific errors

## Related Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Human contributor guide
- [Changesets documentation](https://github.com/changesets/changesets)
- [Turborepo documentation](https://turbo.build/docs)
