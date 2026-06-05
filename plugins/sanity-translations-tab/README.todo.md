# TODO: Manual Steps for `sanity-translations-tab`

This plugin was scaffolded using `pnpm generate "copy plugin"`.

**Original source:** https://github.com/sanity-io/sanity-translations-tab

## 1. Configure Trusted Publishing (CRITICAL)

⚠️ **If trusted publishing is not configured correctly, the plugin will fail to publish from this monorepo.**

Run this command locally (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github sanity-translations-tab --file=release.yml --repository=sanity-io/plugins
```

## 2. Verify Required Config Files

These files are required for monorepo conventions and are scaffolded for you:

- `package.json`
- `package.config.ts`
- `tsconfig.json`
- `tsconfig.build.json`
- `vitest.config.ts`

## 3. Update CHANGELOG.md

Update the top of `CHANGELOG.md` — remove the conventional commits header if present and replace with:

```md
# sanity-translations-tab
```

## 4. Do Not Update CODEOWNERS

Do not update `.github/CODEOWNERS` as part of plugin transfer unless explicitly requested by maintainers.

## 5. Verify Setup

1. Run `pnpm install` from the monorepo root
2. Run `pnpm build` to verify the plugin builds correctly
3. Run `pnpm dev` to test in the test studio
4. Create a changeset: `pnpm changeset add` (**major**)
