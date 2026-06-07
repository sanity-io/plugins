---
name: plugin-transfer
description: Guides agents through migrating an existing plugin into this monorepo with the copy-plugin generator workflow.
---

# Plugin Transfer

Use this skill when migrating an existing plugin repository into `sanity-io/plugins`.

## Start Here

Always start with:

```bash
pnpm generate "copy plugin"
```

This is the canonical transfer flow and scaffolds monorepo-compatible files, test-studio wiring, and migration TODOs.

## Required vs Unnecessary Config

Keep and maintain these monorepo config files in the transferred plugin:

- `package.json`
- `package.config.ts`
- `tsconfig.json`
- `tsconfig.build.json`
- `vitest.config.ts`

Do not copy standalone-repo-only setup such as custom root CI/build/lint/test configs that are already handled by this monorepo.

## Required Transfer Checks

1. Keep the original plugin `README.md` in the new plugin workspace.
2. Add and verify the generated test-studio example under `dev/test-studio/src/<plugin-example>/index.tsx`.
3. Confirm the plugin is wired in `dev/test-studio/sanity.config.ts`.
4. Do **not** update `.github/CODEOWNERS` during transfer unless explicitly requested.
5. Add a changeset with a **major** bump for the transferred plugin (see [Changesets](#changesets)).
6. Update the root `README.md` plugins table with the transferred plugin.
7. Add **Maintainer follow-up** TODOs to the transfer PR description (see [Maintainer follow-up](#maintainer-follow-up)).
8. Run the full pre-PR verification suite (see [Before Submitting a PR](#before-submitting-a-pr)).

## Before Submitting a PR

Run these commands in order. **All must pass** or CI will fail:

```bash
# 1. Format code
pnpm format

# 2. Check for unused exports, dependencies, and catalog entries
pnpm knip

# 3. Run linters (includes TypeScript type checking)
pnpm lint

# 4. Build all packages
pnpm build

# 5. Run tests
pnpm test run
```

### Knip

The copy-plugin generator adds a workspace entry to `knip.jsonc`. After transfer, fix any knip issues in the plugin:

- Remove unused exports (e.g. helpers only used internally should not be exported).
- Remove dead code flagged as unused.

Catalog warnings for `dev/*` workspaces (e.g. `@sanity/vision` used only by `dev/test-studio`) are expected—the root `knip.jsonc` sets `"catalog": "warn"` for those.

### Lint

Transferred plugins may carry legacy patterns that fail monorepo lint rules. Fix what you can; for remaining issues in legacy `src/` or `test/` code, add targeted `.oxlintrc.json` overrides or `ignorePatterns` rather than disabling rules repo-wide.

Common legacy fixes:

- Replace `createRequire` / `require()` with ESM `import` (add `"resolveJsonModule": true` to the plugin `tsconfig.json` for JSON imports).
- Use `import.meta.url` with `fileURLToPath` instead of `__dirname` in tests.
- Remove stale `eslint-disable` comments that oxlint reports as unused.

### Tests

Vitest runs against built `dist/` output (`pretest` builds packages automatically). Fix path resolution and module import issues in legacy test files. The plugin's own `test/` suite (if present) runs via the root vitest config when included in the plugin workspace.

## Changesets

Every transferred plugin needs a **major** changeset. Compare the transferred plugin's `package.json` (peer dependencies, engines, exports, and build config) against the last published version on npm. Do not copy a template blindly—only list breaking changes that actually apply.

Use this format:

```markdown
---
'package-name': major
---

Port PACKAGE-NAME to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: ...
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: ...
- **Sanity Studio v5+ required**: ...
- **Node.js 20.19+ required**: ...
```

Include additional bullets only when they apply to the plugin—for example:

- **styled-components 6.1+ required** (UI plugins that use styled-components)
- **react-dom 19.2+ required** (when newly added as a peer dependency)
- **Dropped Sanity v3/v4 support** (when the previous peer range allowed older Studio versions)

Example for `sanity-naive-html-serializer`:

```markdown
---
'sanity-naive-html-serializer': major
---

Port sanity-naive-html-serializer to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
```

## Maintainer follow-up

Agents cannot complete these steps themselves. Ask the maintainer to handle them, and add the following as unchecked TODOs in the transfer PR description (fill in the links and plugin name for each transfer):

- Update the original repo README (`<link to readme>`) and replace it with: `# [This plugin has moved](<new location>)`
- Transfer pending issues from the original repo to this monorepo and label them as `<plugin-name>`
- Archive the original repo: `<repo link>/settings`

Example for `sanity-naive-html-serializer`:

- Update the original repo README (https://github.com/sanity-io/sanity-naive-html-serializer/blob/main/README.md) and replace it with: `# [This plugin has moved](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-naive-html-serializer)`
- Transfer pending issues from the original repo to this monorepo and label them as `naive-html-serializer`
- Archive the original repo: https://github.com/sanity-io/sanity-naive-html-serializer/settings

## Anything Else To Consider

- Review copied dependencies and peer dependencies carefully.
- Run the [Before Submitting a PR](#before-submitting-a-pr) verification suite—not just `pnpm build` and `pnpm dev`.
- Use `pnpm dev` to manually verify the test-studio example after the automated checks pass.
