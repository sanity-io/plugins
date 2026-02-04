# TODO: Manual Steps for `@sanity/document-internationalization`

This plugin was scaffolded using `pnpm generate "copy plugin"`.

**Original source:** https://github.com/sanity-io/document-internationalization

## 1. Configure Trusted Publishing (CRITICAL)

⚠️ **If trusted publishing is not configured correctly, the plugin will fail to publish from this monorepo.**

Go to the npm package access settings:

**https://www.npmjs.com/package/@sanity/document-internationalization/access**

### Configure GitHub Actions as Trusted Publisher

Under **"Publishing access"**, click **"Add a trusted publisher"** and select **"GitHub Actions"**.

Fill in the fields **exactly** as shown:

| Setting              | Value           |
| -------------------- | --------------- |
| **Owner**            | `sanity-io`     |
| **Repository**       | `plugins`       |
| **Workflow**         | `release.yml`   |
| **Environment name** | _(leave empty)_ |

Click **"Add trusted publisher"**.

### Configure Token Settings

Under **"Token settings"**, ensure:

- ✅ **Require 2FA** for publishing is enabled
- ✅ **Disallow tokens** (both granular and automation tokens)

This ensures only the GitHub Actions release workflow can publish this package using OIDC-based trusted publishing.

## 2. Update package.json Dependencies

Manually update `package.json` with any missing dependencies from the original plugin:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `exports` (if the original has custom export paths)

**Do NOT copy over:**

- `@sanity/incompatible-plugin`
- `@sanity/plugin-kit`

## 3. Source Files

The `src/` directory was automatically imported from the original repository with full git history preserved.

After reviewing, update the test studio example at:

`dev/test-studio/src/document-internationalization/index.tsx`

Add any required options, schemas, or configuration needed to properly test the plugin in the test studio.

## 4. Update CHANGELOG.md

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
# @sanity/document-internationalization
```

## 5. Verify Setup

1. Run `pnpm install` from the monorepo root
2. Run `pnpm build` to verify the plugin builds correctly
3. Run `pnpm dev` to test in the test studio
4. Create a changeset: `pnpm changeset add`

## 6. Copy README.md (Final Step)

Copy the `README.md` from the original plugin and replace this file with it.
