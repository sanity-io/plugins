# Agent Guide for Sanity Plugins Monorepo

This guide is for AI agents working on this codebase. Follow these instructions to ensure successful contributions.

> **Self-Improvement:** If you discover undocumented requirements, commands, or workflows during your work (e.g., a reviewer asks you to run something not covered here), update this file on the same PR. Keep this guide accurate and helpful for future agents.

## Quick Reference

| Task                 | Command              |
| -------------------- | -------------------- |
| Install dependencies | `pnpm install`       |
| Format code          | `pnpm format`        |
| Run linters          | `pnpm lint`          |
| Build all packages   | `pnpm build`         |
| Run tests            | `pnpm test`          |
| Add changeset        | `pnpm changeset add` |
| Start dev server     | `pnpm dev`           |

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

# 2. Run linters (oxlint)
pnpm lint

# 3. Build all packages
pnpm build

# 4. Run tests
pnpm test
```

### Required: Add Changesets

Every PR that changes published packages **must** include changesets. **Important:** Create a separate changeset file for each plugin you modify.

#### Why Separate Changesets?

Each plugin has its own changelog that consumers read. A combined changeset would pollute individual plugin changelogs with irrelevant information. For example, `@sanity/code-input`'s changelog should not mention workflow-specific changes.

#### How to Add Changesets

**Option 1: Manual Creation (Recommended for Multiple Plugins)**

Create individual `.md` files in `.changeset/` directory:

```markdown
---
'plugin-name': patch
---

Brief description of the change specific to this plugin
```

**Example:** If you modified 3 plugins, create 3 files:

```bash
# .changeset/code-input-fix.md
---
"@sanity/code-input": patch
---

Fix input border styling with v2 theme API

# .changeset/workflow-hooks.md
---
"sanity-plugin-workflow": patch
---

Replace deprecated useTimeAgo hook with useRelativeTime

# .changeset/markdown-theme.md
---
"sanity-plugin-markdown": patch
---

Migrate to v2 theme API for color properties
```

**Option 2: Interactive CLI (For Single Plugin)**

```bash
pnpm changeset add
```

Follow the prompts to:

1. Select **one** package that changed
2. Choose the version bump type (patch/minor/major)
3. Write a summary of changes **specific to that package**
4. Repeat for each modified package

#### Changeset Guidelines

- **Scope**: Each changeset should only mention changes relevant to that specific plugin
- **Clarity**: Write from the consumer's perspective—what do they need to know?
- **Version bumps**:
  - `patch`: Bug fixes, dependency updates, internal refactors
  - `minor`: New features, non-breaking API additions
  - `major`: Breaking changes
- **Format**: Use clear, concise language without technical jargon when possible

#### Bad vs Good Examples

❌ **Bad** (combined changeset):

```markdown
---
'@sanity/code-input': patch
'sanity-plugin-workflow': patch
---

- Migrated to v2 theme APIs
- Replaced useTimeAgo with useRelativeTime
- Fixed input styling
```

_Problem: Workflow's changelog will say "Fixed input styling" which is irrelevant_

✅ **Good** (separate changesets):

```markdown
# .changeset/code-input-theme.md

---

## "@sanity/code-input": patch

Migrate to v2 theme API for input styling

# .changeset/workflow-hooks.md

---

## "sanity-plugin-workflow": patch

Replace deprecated useTimeAgo hook with useRelativeTime
```

_Each plugin's changelog only shows relevant changes_

## CI Checks

The CI pipeline runs on every PR:

| Job       | What it checks                                         |
| --------- | ------------------------------------------------------ |
| **build** | `pnpm build` - All packages compile successfully       |
| **lint**  | `pnpm lint --format github` - Code passes oxlint       |
| **test**  | `pnpm test` - All tests pass (runs after build + lint) |

### Lint Specifics

- **oxlint**: Type-aware linting with `--deny-warnings` (warnings are errors). React Compiler rules run via the react-hooks-js plugin.
- **TypeScript type checking** is included in `pnpm lint` (via oxlint's `--type-check --type-aware` flags) — no separate `tsc` needed
- Run `pnpm lint:fix` to auto-fix issues when possible

## Testing

The monorepo uses [Vitest v4](https://vitest.dev) for testing.

### Running Tests

```bash
# Run all tests (non-watch mode)
pnpm test run

# Run tests in watch mode (default vitest behavior)
pnpm test

# Update snapshots
pnpm test -u
```

### Writing Tests

Tests are co-located with source code in the `src/` directory:

- Test files use `.test.ts` or `.spec.ts` extensions
- Each plugin has a minimal `vitest.config.ts` that inlines `vitest-package-exports`
- All plugins include a package exports test using `vitest-package-exports` to verify all exports are valid

When creating a new plugin with `pnpm generate`, test files are automatically created. The root `vitest.config.ts` uses glob patterns to automatically discover all plugins, so new plugins are included without manual configuration.

Example test file (`src/index.test.ts`):

```ts
import {fileURLToPath} from 'node:url'
import {expect, test} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

test('package exports', {timeout: 30_000}, async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'dist',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchInlineSnapshot()
})
```

#### Test Timeouts

Always use the options object syntax for timeouts, placing it as the second argument:

```ts
// Correct - options object as second argument
test('my test', {timeout: 30_000}, async () => {
  // ... test code
})

// Wrong - timeout as third argument (deprecated style)
test('my test', async () => {
  // ...
}, 30000)
```

Use numeric separators (`30_000` instead of `30000`) for readability.

### Test Configuration

- Root `vitest.config.ts` uses glob patterns `['plugins/@sanity/*', 'plugins/sanity-plugin-*']` to automatically find all plugin projects
- Individual plugins have minimal `vitest.config.ts` starting with just inline deps configuration for vitest-package-exports
- Plugins can expand their vitest configs and test suites over time as needed (unit tests, integration tests, etc.)
- Tests run against built `dist/` output after `pnpm build`
- Snapshots are generated with `pnpm test -u`

## Pull Request Workflow

### 1. Create as Draft PR First

Always open PRs as **draft** initially. The prompter (person who requested the work) reviews first before marking ready for team review.

### 2. Apply the "🤖 bot" Label

**All PRs created by AI agents must be labeled with "🤖 bot".** This label helps the team identify bot-created PRs and ensures proper tracking and review workflows.

When creating or updating a PR, always ensure the `🤖 bot` label is applied.

### 3. Move Out of Draft

Once the prompter approves, convert from draft to ready-for-review so the team can review.

### 4. Merge Process

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

- Setting up npm trusted publishing (different process for new vs existing packages)
- Creating initial release changesets
- Migrating existing plugins

### Trusted Publishing Quick Reference

**For brand new packages (not yet on npm):**

- Use the "Setup a new npm package with Trusted Publishing" GitHub Actions workflow
- The workflow will create the package and provide setup instructions

**For existing packages (already on npm):**

- ⚠️ DO NOT use the setup workflow
- Manually configure trusted publishing at: `https://www.npmjs.com/package/PACKAGE-NAME/access`
- Add GitHub Actions as trusted publisher with:
  - Owner: `sanity-io`
  - Repository: `plugins`
  - Workflow: `release.yml`
  - Environment: _(leave empty)_

## Code Style

### Dependencies

**Always use `lodash-es` instead of `lodash`**

When working with lodash utility functions, always use the `lodash-es` package instead of `lodash`. The `lodash-es` package is the ES module version that supports tree-shaking and works correctly with modern build tools.

```bash
# Correct
pnpm add lodash-es

# Wrong
pnpm add lodash
```

### Formatting

We use [oxfmt](https://oxc.rs/docs/formatter.html):

```bash
pnpm format
```

### Linting

We use [oxlint](https://oxc.rs/docs/linter.html) for all linting (type-aware, includes TypeScript type checking and React Compiler rules via the react-hooks-js plugin):

```bash
pnpm lint        # Run the linter (includes type checking)
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
