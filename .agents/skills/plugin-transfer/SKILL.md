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
5. Add a changeset with a **major** bump for the transferred plugin.
6. Update the root `README.md` plugins table with the transferred plugin.

## Anything Else To Consider

- Review copied dependencies and peer dependencies carefully.
- Run `pnpm build`, `pnpm test`, and `pnpm dev` to verify migration quality.
