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

This is the canonical transfer flow and scaffolds monorepo-compatible files and test-studio wiring.

**Do not keep migration TODOs in the repo.** If the generator creates `README.todo.md`, delete it after moving its contents into the transfer PR description. Maintainers can update PR checklists directly on GitHub without a code change.

## Required vs Unnecessary Config

Keep and maintain these monorepo config files in the transferred plugin:

- `package.json`
- `package.config.ts`
- `tsconfig.json`
- `tsconfig.build.json`
- `vitest.config.ts`

Do not copy standalone-repo-only setup such as custom root CI/build/lint/test configs that are already handled by this monorepo.

## Clean Up the Transferred README

The original `README.md` is preserved, but old standalone-repo content is almost always stale in the monorepo. Remove or rewrite the following before opening the PR:

- **Old release/development sections.** Delete sections that describe the original repo's release or dev tooling, e.g. `## Develop & test` (typically references `@sanity/plugin-kit`) and `### Release new version` (references the original repo's GitHub Actions / semantic-release). The monorepo handles building, testing, and releasing centrally, so these instructions are wrong here.
- **Links to old/forked versions.** Remove pointers like "for the v2 version, see this other repo" that link to pre-transfer forks or legacy repositories.
- **Specific Sanity Studio major versions.** Do not reference the current latest Studio major (e.g. "Sanity Studio v6") since it ages quickly, and do not mention long-gone majors like v3. Reword phrasing such as "migrated to Sanity Studio V3" / "only the v3 version is maintained" to a version-agnostic statement (e.g. "maintained by Sanity.io"). Only mention a version when genuinely necessary—at most as `v2 - legacy` to disambiguate a legacy line—and usually omit it entirely.

Keep the substance that is still accurate: intro/description, screenshots, acknowledgements, install, usage, configuration, and license sections.

## Required Transfer Checks

1. Keep the original plugin `README.md` in the new plugin workspace, but clean it up (see [Clean Up the Transferred README](#clean-up-the-transferred-readme)).
2. Restore `LICENSE` from the original repository when it credits authors beyond Sanity.io alone (the copy-plugin generator deletes it during cleanup). If kept, update the copyright year(s) to the current year.
3. Add and verify the generated test-studio example under `dev/test-studio/src/<plugin-example>/index.tsx`.
4. Confirm the plugin is wired in `dev/test-studio/sanity.config.ts`.
5. Do **not** update `.github/CODEOWNERS` during transfer unless explicitly requested.
6. Add a changeset with a **major** bump for the transferred plugin (see [Changesets](#changesets)).
7. Update the root `README.md` plugins table with the transferred plugin.
8. Add pending transfer TODOs to the transfer PR description only (see [PR description checklist](#pr-description-checklist)—not in a README or other repo file).
9. Run the full pre-PR verification suite (see [Before Submitting a PR](#before-submitting-a-pr)).

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

#### Duplicate `sanity` peer variants break type-aware lint

Type-aware lint can fail (sometimes intermittently, especially on cold installs) with errors like `Type 'import(".../.pnpm/sanity@X_<hashA>/...").D' is not assignable to type 'import(".../.pnpm/sanity@X_<hashB>/...").D'` in `dev/test-studio/src/**` examples. This happens when the transferred plugin resolves `sanity` to a different pnpm peer-variant than the other plugins, creating an extra duplicate copy of sanity's type definitions.

To keep the plugin on the shared `sanity` variant, declare these in the plugin `devDependencies`:

- `"@types/node": "catalog:"`
- `"styled-components": "catalog:"` (when the plugin depends on `@sanity/ui`, which peers on styled-components; without the declaration pnpm auto-installs the peer and bypasses the workspace `@sanity/styled-components` override)

Verify alignment by checking that the plugin importer's `sanity` version string in `pnpm-lock.yaml` matches other plugins (e.g. `plugins/@sanity/sfcc`).

> **Do not migrate styling during a transfer.** When the plugin already uses `styled-components`, keep it as-is for the initial port — the goal is a faithful, low-risk move. Migrating to vanilla-extract (the preferred styling for new code) is a **separate follow-up PR**, done with care to preserve visual fidelity and avoid regressions. The `styled-components: catalog:` alignment above still applies. See the `sanity-plugin-best-practices` styling reference for the greenfield-vs-brownfield rule.

### Tests

Vitest runs against built `dist/` output (`pretest` builds packages automatically). Fix path resolution and module import issues in legacy test files. The plugin's own `test/` suite (if present) runs via the root vitest config when included in the plugin workspace.

## Changesets

Every transferred plugin needs a **major** changeset. Compare the transferred plugin's `package.json` (peer dependencies, engines, exports, and build config) against the last published version on npm. Do not copy a template blindly—only list breaking changes that actually apply.

### Credit every contributor

Because the transfer PR is opened by someone else (often the `🤖 bot`), the generated release would otherwise thank the wrong person. Add an `author:` directive so the changelog credits the people who actually built the plugin. [Multiple `author:` lines are supported](https://github.com/changesets/changesets/blob/c2db1dd5d2da6c6eb514d86bbe05cbb7227b067f/packages/changelog-github/src/index.test.ts#L229-L243), so list **everyone** who worked on the plugin being ported — not just the latest author — so they all get their thanks in the release notes.

- Use the contributors' **GitHub usernames**, always with a leading `@` (e.g. `author: @stipsan`).
- Put each `author:` line on its own line, before the summary text. The lines are stripped from the rendered changelog.
- Gather contributors from the original repo's commit history, `package.json` `author`/`contributors`, and the README acknowledgements.

```markdown
---
'package-name': major
---

author: @stipsan
author: @rexxars

Port PACKAGE-NAME to the Sanity plugins monorepo
```

This produces a release line thanking each contributor:

> Thanks [@stipsan](https://github.com/stipsan), [@rexxars](https://github.com/rexxars)! - Port PACKAGE-NAME to the Sanity plugins monorepo

See [AGENTS.md → Crediting Original Authors](../../../AGENTS.md) for the full rationale.

### Format

Use this format (add the `author:` lines from [Credit every contributor](#credit-every-contributor) above the summary):

```markdown
---
'package-name': major
---

author: @stipsan
author: @rexxars

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

author: @stipsan
author: @rexxars

Port sanity-naive-html-serializer to the Sanity plugins monorepo

This major release includes several breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **ESM-only**: CommonJS support has been removed. The package now ships only ESM
- **React 19.2+ required**: Minimum React version is now 19.2 (previously ^18.3 || ^19)
- **react-dom 19.2+ required**: `react-dom` is now a required peer dependency
- **Sanity Studio v5+ required**: Minimum Sanity version is now v5 (Sanity v3 and v4 are no longer supported)
- **Node.js 20.19+ required**: Minimum Node.js version is now 20.19 (previously >=18)
```

## PR description checklist

Put all pending transfer work in the **PR description** as unchecked checkboxes. Do not create `README.todo.md` or similar todo files in the plugin workspace—the maintainer should be able to check items off on GitHub without opening a PR to edit repo files.

Include these sections in every transfer PR:

### Transfer verification

- [ ] Trusted publishing configured: `npm trust github <package-name> --file=release.yml --repository=sanity-io/plugins`
- [ ] `package.json` dependencies/peerDependencies/exports verified against original repo
- [ ] `LICENSE` restored with updated copyright year when the original credits authors beyond Sanity.io alone
- [ ] Test studio example wired and manually verified (`pnpm dev`)
- [ ] `pnpm format`, `pnpm knip`, `pnpm lint`, `pnpm build`, `pnpm test run` all pass
- [ ] Major changeset added with validated breaking changes

### Maintainer follow-up

Agents cannot complete these steps themselves. Ask the maintainer to handle them:

- [ ] Update the original repo README (`<link to readme>`) and replace it with: `# [This plugin has moved](<new location>)`
- [ ] Transfer pending issues from the original repo to this monorepo and label them as `<plugin-name>`
- [ ] Archive the original repo: `<repo link>/settings`

Example for `sanity-naive-html-serializer`:

- [ ] Update the original repo README (https://github.com/sanity-io/sanity-naive-html-serializer/blob/main/README.md) and replace it with: `# [This plugin has moved](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-naive-html-serializer)`
- [ ] Transfer pending issues from the original repo to this monorepo and label them as `naive-html-serializer`
- [ ] Archive the original repo: https://github.com/sanity-io/sanity-naive-html-serializer/settings

## Anything Else To Consider

- **Do not migrate styling during the transfer.** Keep an existing `styled-components` plugin on `styled-components` for the initial port; defer any vanilla-extract migration to a follow-up PR (see [the styling note above](#duplicate-sanity-peer-variants-break-type-aware-lint)).
- Review copied dependencies and peer dependencies carefully.
- Run the [Before Submitting a PR](#before-submitting-a-pr) verification suite—not just `pnpm build` and `pnpm dev`.
- Use `pnpm dev` to manually verify the test-studio example after the automated checks pass.
