# TODO: Manual Steps for `@sanity/hierarchical-document-list`

This plugin was scaffolded using `pnpm generate "copy plugin"`.

**Original source:** https://github.com/sanity-io/hierarchical-document-list

## 1. Configure Trusted Publishing (CRITICAL)

⚠️ **If trusted publishing is not configured correctly, the plugin will fail to publish from this monorepo.**

Run this command locally (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github @sanity/hierarchical-document-list --file=release.yml --repository=sanity-io/plugins
```

This sets up OIDC-based trusted publishing so the GitHub Actions release workflow can publish this package without storing npm tokens.

<details>
<summary>Alternative: Configure via npm website</summary>

If you don't have npm >= 11.10.0, you can configure trusted publishing manually:

1. Go to **https://www.npmjs.com/package/@sanity/hierarchical-document-list/access**
2. Under **"Publishing access"**, click **"Add a trusted publisher"** and select **"GitHub Actions"**
3. Fill in the fields:

| Setting              | Value           |
| -------------------- | --------------- |
| **Owner**            | `sanity-io`     |
| **Repository**       | `plugins`       |
| **Workflow**         | `release.yml`   |
| **Environment name** | _(leave empty)_ |

4. Click **"Add trusted publisher"**

</details>

## 2. Verify Required Config Files

These files are required for monorepo conventions and are scaffolded for you:

- `package.json`
- `package.config.ts`
- `tsconfig.json`
- `tsconfig.build.json`
- `vitest.config.ts`

Do not bring over standalone-repo config that is not used here (for example custom root build/lint/test configs and CI files).

## 3. Update package.json Dependencies

Manually update `package.json` with any missing dependencies from the original plugin:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `exports` (if the original has custom export paths)

**Do NOT copy over:**

- `@sanity/incompatible-plugin`
- `@sanity/plugin-kit`

## 4. Source Files

The `src/` directory was automatically imported from the original repository with full git history preserved.

After reviewing, update the test studio example at:

`dev/test-studio/src/hierarchical-document-list/index.tsx`

Add any required options, schemas, or configuration needed to properly test the plugin in the test studio.

## 5. Update CHANGELOG.md

The `CHANGELOG.md` was automatically copied from the original repository.

Update the top of the file - **remove this header if present:**

```md
<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.
```

**Replace with:**

```md
# @sanity/hierarchical-document-list
```

## 6. Do Not Update CODEOWNERS

Do not update `.github/CODEOWNERS` as part of plugin transfer unless explicitly requested by maintainers.

## 7. Verify Setup

1. Run `pnpm install` from the monorepo root
2. Run `pnpm build` to verify the plugin builds correctly
3. Run `pnpm dev` to test in the test studio
4. Create a changeset: `pnpm changeset add` (**major**)

## 8. README.md (Already copied)

`README.md` from the original repository was preserved during import. Keep this `README.todo.md` file for migration notes until the transfer is complete.
