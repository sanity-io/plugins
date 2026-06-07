# TODO: Manual Steps for `sanity-plugin-transifex`

This plugin was scaffolded using `pnpm generate "copy plugin"`.

**Original source:** https://github.com/sanity-io/sanity-plugin-transifex

## 1. Configure Trusted Publishing (CRITICAL)

⚠️ **If trusted publishing is not configured correctly, the plugin will fail to publish from this monorepo.**

Run this command locally (requires [npm >= 11.10.0](https://docs.npmjs.com/cli/v11/commands/npm-trust)):

```bash
npm trust github sanity-plugin-transifex --file=release.yml --repository=sanity-io/plugins
```

## 2. Verify Setup

1. Run `pnpm install` from the monorepo root
2. Run `pnpm build` to verify the plugin builds correctly
3. Run `pnpm dev` to test in the test studio
