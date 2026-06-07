# TODO: Manual Steps for `sanity-naive-html-serializer`

This plugin was scaffolded using `pnpm generate "copy plugin"`.

**Original repository:** https://github.com/sanity-io/sanity-naive-html-serializer

## 1. Configure Trusted Publishing (CRITICAL)

⚠️ **If trusted publishing is not configured correctly, the plugin will fail to publish from this monorepo.**

Run this command locally (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github sanity-naive-html-serializer --file=release.yml --repository=sanity-io/plugins
```

## 2. Verify Required Config Files

These files are required for monorepo conventions and are scaffolded for you:

- `package.json`
- `package.config.ts`
- `tsconfig.json`
- `tsconfig.build.json`
- `vitest.config.ts`

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

The test studio example lives at:

`dev/test-studio/src/sanity-naive-html-serializer/index.tsx`

## 5. Update CHANGELOG.md

The `CHANGELOG.md` was automatically copied from the original repository.

## 6. Do Not Update CODEOWNERS

Do not update `.github/CODEOWNERS` as part of plugin transfer unless explicitly requested by maintainers.

## 7. Verify Setup

1. Run `pnpm install` from the monorepo root
2. Run `pnpm build` to verify the plugin builds correctly
3. Run `pnpm dev` to test in the test studio
4. Create a changeset: `pnpm changeset add` (**major**)

## 8. README.md (Already copied)

`README.md` from the original repository was preserved during import. Keep this `README.todo.md` file for migration notes until the transfer is complete.
