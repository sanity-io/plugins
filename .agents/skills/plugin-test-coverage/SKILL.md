---
name: plugin-test-coverage
description: Guides agents through expanding Vitest and Playwright e2e coverage for a monorepo plugin. Use when adding or improving plugin tests, wiring e2e-studio, or following the internationalized-array / document-internationalization coverage playbook.
---

# Plugin Test Coverage

Use this skill when expanding **Vitest** and/or **Playwright e2e** coverage for a plugin under `plugins/`.

Reference implementations:

- `@sanity/document-internationalization` — Vitest + e2e under `e2e/tests/document-internationalization/`
- `sanity-plugin-internationalized-array` — Vitest + e2e under `e2e/tests/internationalized-array/`

Also read [`e2e/README.md`](../../../e2e/README.md) before writing Playwright specs.

## When to use

- Filling unit/integration gaps for a published plugin
- Wiring a plugin into `dev/e2e-studio` and adding Playwright specs
- Porting the doc-i18n / internationalized-array coverage process to another plugin

## Workflow

1. **Inventory use cases** from README + source (authoring loops, config knobs, integrations).
2. **Map each use case** to Vitest (pure logic, components with mocks) vs Playwright (studio UX that needs a real form).
3. **Fill Vitest gaps** co-located under `plugins/<pkg>/src/` — plugin assembly, context/providers, utils, components.
4. **Wire e2e-studio** — `definePlugin` example file, register in **both** chromium/firefox workspaces.
5. **Add helpers + specs** — `e2e/helpers/<plugin>/`, `e2e/tests/<plugin>/`.
6. **Changesets** — separate patch changeset per published package that gained `data-testid`s or runtime changes. Private e2e/studio files need none.
7. **Verify** — `pnpm format && pnpm lint && pnpm knip && pnpm build && pnpm test` (and targeted e2e when secrets allow).
8. **PR** — draft, `🤖 bot` label, inventory + e2e test table in the description.

Skip one-off tooling (migrations, banners) unless they are part of the main authoring loop.

## Vitest patterns

- Co-locate `*.test.ts(x)` next to source; use jsdom via the package `vitest.config.ts`.
- Shared mocks/fixtures in `src/test/helpers.ts` and `src/test/component-helpers.tsx` (`ThemeWrapper` for `@sanity/ui`).
- Plugin assembly tests: call the plugin factory, assert schema type names, document layout, form input wrappers, nested plugins.
- Context/provider tests: mock `useClient` / `useWorkspace` / pane hooks; use `Suspense` + `act` for async `React.use` language resolution; call any module-level `clear()` between tests.
- Timeouts: `test('name', {timeout: 30_000}, async () => { … })` — options object as second arg.
- Keep the package-exports snapshot test; update with `pnpm test -u` only when exports intentionally change.
- React Compiler is on — do not add unnecessary `useMemo` / `useCallback`.

Run a single package:

```bash
pnpm --filter <package-name> test run
```

## E2e structure

```
e2e/
├── tests/
│   ├── smoke.spec.ts                 # studio-wide only
│   └── <plugin-name>/
│       └── <plugin-name>.spec.ts
└── helpers/
    └── <plugin-name>/
        └── <helpers>.ts
```

Do not dump plugin specs at the top level of `tests/`.

## E2e-studio wiring

1. Add `dev/e2e-studio/src/<example>.ts` with `definePlugin` that registers schema + the plugin under test.
2. Import and add it to **both** workspaces in `dev/e2e-studio/sanity.config.ts`.
3. Ensure the workspace `package.json` already depends on the plugin (`workspace:*`).
4. Update the “Currently wired” list in `e2e/README.md`.

## Hard-won Playwright lessons

- Project `baseURL` must end with a **trailing slash** (`…/chromium/`, `…/firefox/`).
- Navigate with **relative** intents: `intent/edit/id=…;type=…`. Never host-absolute `/intent/…` (drops workspace basePath → “Workspace not found”).
- Auth: Playwright `storageState` seeds `__studio_auth_token_<projectId>`; preflight `/users/me`. Never use `SANITY_DEPLOY_TOKEN` for e2e session auth.
- Local pitfall: stale server on `:3333` + `reuseExistingServer` → signed-out studio. Kill and restart.
- Prefer accessible role/name locators; add `data-testid` + a **patch** changeset only when selectors are flaky or ambiguous (e.g. duplicate add-button grids).
- Seed documents via the Content Lake API; always `try/finally` cleanup.
- Video: `SANITY_E2E_VIDEO=on` when debugging.
- Document existence matters: some plugins only auto-seed after `_rev` exists — seed empty persisted docs, don’t rely on brand-new unsaved drafts.

## PR checklist

- [ ] Separate changeset per published package touched
- [ ] Draft PR with `🤖 bot` label
- [ ] Use-case inventory + e2e test table in the description
- [ ] `pnpm format` / `lint` / `knip` / `build` / `test` green
- [ ] CI e2e (chromium + firefox) green when studio wiring changed

## Pointers

- [`e2e/README.md`](../../../e2e/README.md)
- [`AGENTS.md`](../../../AGENTS.md) — CI commands, changesets, Node version notes
- Doc-i18n + internationalized-array as living examples
