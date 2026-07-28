---
name: migrate-styled-components-to-vanilla-extract
description: Step-by-step procedure for migrating one plugin in this monorepo off styled-components to vanilla-extract (zero-runtime CSS). Use when converting styled() components to .css.ts files, removing a plugin's styled-components dependency, adding the ./bundle.css export, or when asked to migrate a plugin's styling. Pair with the sanity-plugin-best-practices styling reference for the underlying patterns.
metadata:
  author: Sanity.io
  version: '1.0.0'
---

# Migrate styled-components to vanilla-extract

The repeatable procedure for converting one plugin's styling from `styled-components` (the Studio's
legacy styling library) to [vanilla-extract](https://vanilla-extract.style). Distilled from the
migrations of `@sanity/google-maps-input`
([PR #1417](https://github.com/sanity-io/plugins/pull/1417)) and `sanity-plugin-workflow`
([PR #1450](https://github.com/sanity-io/plugins/pull/1450)).

This skill covers the **workflow**: what to change, in what order, and how to verify it. The styling
**patterns** themselves (dynamic theming, variants, keyframes, the `&&` specificity trick,
encapsulation) live in the `sanity-plugin-best-practices` skill's
[styling reference](../sanity-plugin-best-practices/references/styling.md) — read it first and defer
to it for pattern details.

## Ground rules

- **One plugin per PR.** A migration must be reviewable and easy to bisect if a visual regression
  slips through.
- **Never during a transfer.** When porting a plugin into the monorepo, keep styled-components as-is
  and migrate in a dedicated follow-up PR (see the `plugin-transfer` skill).
- **Identical visual output is the goal.** This is a refactor, not a redesign — every rule, theme
  token, and specificity outcome must be preserved. Verify manually in the test studio before
  opening the PR.
- **Reference implementations** to compare against: `plugins/@sanity/google-maps-input`,
  `plugins/sanity-plugin-workflow`, and `plugins/sanity-plugin-bynder-input` — all fully migrated on
  the current tsdown setup.

## Step 1: Inventory

Find every styled-components usage in the plugin and classify it before touching code:

```bash
rg "styled-components" plugins/<plugin-name>/src
```

| Usage                                               | Migration target                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Static `styled(Primitive)` / `styled.div`           | `style()` in a colocated `.css.ts` + thin wrapper component (or plain `className`) |
| Theme reads (`({theme}) => theme.sanity...`)        | `createVar()` + `assignInlineVars()` + `useTheme_v2()`                             |
| Prop-driven variants (`$isInvalid`, `css` branches) | `styleVariants()` or conditional class composition                                 |
| `keyframes` animations                              | vanilla-extract `keyframes()`                                                      |
| Descendant selectors (`& img`, third-party classes) | class on the child directly, or `globalStyle()` scoped under a local wrapper class |
| `createGlobalStyle`                                 | `globalStyle()` (scope it — never leak outside the plugin)                         |
| `*.styles.tsx` modules                              | replaced by `.css.ts` (+ a component layer where call sites need it)               |

Each row's pattern is documented with examples in the
[styling reference](../sanity-plugin-best-practices/references/styling.md).

## Step 2: Migrate the code

Work component by component. Create a `.css.ts` next to each component and move its rules over. Two
real shapes cover most cases:

**Shape A — keep the component layer** (from `sanity-plugin-workflow`, PR #1450). When the styled
element is used like a component (composed, given props), replace it with a `style()` rule plus a
thin wrapper that keeps the same name and API, so call sites don't change:

```ts
// FloatingCard.css.ts
import {style} from '@vanilla-extract/css'

export const floatingCard = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
  zIndex: 1000,
})
```

```tsx
// FloatingCard.tsx — before: const StyledFloatingCard = styled(Card)`position: fixed; ...`
import {Card} from '@sanity/ui'
import type {ComponentProps} from 'react'

import {floatingCard} from './FloatingCard.css'

function StyledFloatingCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={floatingCard} />
}
```

Type the wrapper with `ComponentProps<typeof Primitive>` (or `ComponentProps<'div'>`), spread props
**before** `className` so the wrapper owns the class, and never use `forwardRef` — `ref` is a
regular prop on React 19. See
[Keep the component layer](../sanity-plugin-best-practices/references/styling.md#keep-the-component-layer-encapsulation).

**Shape B — flatten single-use wrappers** (from `@sanity/google-maps-input`, PR #1417). When the
styled element was an internal, single-use `styled.div` with no meaningful API, put the class
directly on the element. Descendant selectors like `& img { ... }` usually migrate best by styling
the child directly when you render it yourself:

```tsx
// Before: <MapDiffImage><img ... /></MapDiffImage> where MapDiffImage = styled.div`& img {...}`
<img className={mapDiffImage} alt="" src={url} height={280} width={500} />
```

For everything else — theme-driven values, variants, keyframes, theming third-party widgets'
classes, and overriding a `@sanity/ui` primitive's own styles (the `selectors: {'&&': {...}}`
trick) — follow the corresponding section of the
[styling reference](../sanity-plugin-best-practices/references/styling.md). Where styled-components
silently won specificity battles via CSSOM insertion order, you may need `&&` to match the original
rendering.

Delete the `*.styles.tsx` modules (and their `styled-components` imports) as they empty out.

## Step 3: Switch the build config

In the plugin's `tsdown.config.ts`, drop `styledComponents: true` and add `vanillaExtract: true`:

```ts
import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: true,
  vanillaExtract: true,
}) satisfies Promise<UserConfig>
```

The integration extracts all `.css.ts` rules into `dist/bundle.css` at build time, auto-imports it
from `dist/index.js`, and writes/syncs the `./bundle.css` entry in `package.json` `exports` and
`publishConfig.exports` on every build — nothing to hand-edit there. After the first build the
export block looks like:

```jsonc
"./bundle.css": {
  "types": "./dist/bundle-css.d.ts",
  "browser": "./dist/bundle.css",
  "style": "./dist/bundle.css",
  "node": "./dist/bundle-css.js",
  "default": "./dist/bundle-css.js"
}
```

## Step 4: Update dependencies

In the plugin's `package.json`:

- **Add** dev dependencies `"@sanity/vanilla-extract-vite-plugin": "catalog:"` and
  `"@vanilla-extract/css": "catalog:"`. Both are build-time only — never runtime `dependencies`.
  (If the plugin uses `assignInlineVars`, add `"@vanilla-extract/dynamic": "catalog:"` under
  `dependencies` — that one is a small runtime helper.)
- **Remove** the `styled-components` entry from `peerDependencies`, and any
  `babel-plugin-styled-components` devDependency.
- **Keep** `"styled-components": "catalog:"` in `devDependencies` while the plugin depends on
  `@sanity/ui` (which peers on styled-components). Removing it makes pnpm resolve a separate
  styled-components copy and forks the plugin's `sanity` peer variant away from the rest of the
  workspace, breaking type-aware lint (this was caught in review on PR #1450 — all migrated plugins
  keep it). Only drop the devDependency when nothing in the plugin's dependency graph peers on
  styled-components.

After `pnpm install`, verify peer alignment: the plugin's `sanity` / `@sanity/ui` resolution strings
in `pnpm-lock.yaml` must match other plugins (e.g. `plugins/@sanity/google-maps-input`).

No `knip.jsonc` or catalog changes are needed — `@vanilla-extract/css` is globally ignored and all
the catalog entries already exist.

## Step 5: Register the Vite plugin for Vitest

The package-exports test resolves the workspace `exports` map, whose `.` entry points at
`./src/index.ts` — so it imports real `.css.ts` source and Vitest needs the plugin to compile it.
Add it to the plugin's `vitest.config.ts`:

```ts
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  // ...existing test config
})
```

Use `@sanity/vanilla-extract-vite-plugin` (faster drop-in for the upstream
`@vanilla-extract/vite-plugin`). The test studio already registers it globally in `sanity.cli.ts` —
don't touch that file.

> **Optional, jsdom-only:** if the plugin has `jsdom`/`happy-dom` suites that don't assert on real
> CSS (layout, `getComputedStyle`), you can skip runtime style injection with
> `setupFiles: ['@vanilla-extract/css/disableRuntimeStyles']`. This does **not** replace the Vite
> plugin, is irrelevant under the default `node` environment, and is opted into per plugin — never
> monorepo-wide. See
> [vanilla-extract test environments](https://vanilla-extract.style/documentation/test-environments/#disabling-runtime-styles).

## Step 6: Build and update the exports snapshot

```bash
pnpm install
pnpm build --filter=<plugin-name>
```

Check the output: `dist/bundle.css` must contain every migrated rule, and `dist/index.js` must
import it. Then update the package-exports inline snapshot, which gains a `"./bundle.css"` entry:

```bash
pnpm test -u --project <plugin-name>
```

## Step 7: Verify

Run the full pre-PR suite (all must pass):

```bash
pnpm format
pnpm lint
pnpm knip
pnpm build
pnpm test run
```

Then verify **visual fidelity** manually: start the test studio (`pnpm dev`), exercise the plugin's
example, and compare against the pre-migration rendering — theme tokens, spacing, stacking,
hover/sticky/fixed behavior. If an override no longer takes effect, reach for the `&&` trick rather
than `!important`.

Optionally lock the migration in: once the plugin no longer imports `styled-components`, a
`no-restricted-imports` ban in a plugin-level lint override keeps it from creeping back.

## Step 8: Add a changeset

One patch changeset for the migrated plugin:

```markdown
---
'<plugin-name>': patch
---

Migrate styling from styled-components to vanilla-extract (zero-runtime CSS)
```

## Checklist

- [ ] Every `styled-components` import in `src/` removed; `.styles.tsx` modules deleted
- [ ] `.css.ts` files colocated with their components; component layer preserved where call sites
      need it
- [ ] `tsdown.config.ts`: `styledComponents` removed, `vanillaExtract: true` added
- [ ] `package.json`: vanilla-extract devDeps added; `styled-components` peer removed;
      `styled-components: catalog:` devDep kept while `@sanity/ui` is a dependency
- [ ] `vitest.config.ts` registers `vanillaExtractPlugin()`
- [ ] `dist/bundle.css` emitted with all rules; package-exports snapshot updated
- [ ] `pnpm format` / `pnpm lint` / `pnpm knip` / `pnpm build` / `pnpm test run` all pass
- [ ] Visual fidelity verified in the test studio
- [ ] Patch changeset added
