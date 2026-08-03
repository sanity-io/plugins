---
name: migrate-styled-components-to-vanilla-extract
description: Step-by-step procedure for migrating a workspace off styled-components to vanilla-extract (zero-runtime CSS). Use when converting styled() components to .css.ts files, removing a styled-components dependency, adding a ./bundle.css export, or when asked to migrate styling to vanilla-extract. Pair with the sanity-plugin-best-practices styling reference for the underlying patterns.
metadata:
  author: Sanity.io
  version: '1.0.0'
---

# Migrate styled-components to vanilla-extract

The repeatable procedure for converting a workspace's styling from `styled-components` (the Studio's
legacy styling library) to [vanilla-extract](https://vanilla-extract.style).

This skill covers the **workflow**: what to change, in what order, and how to verify it. The styling
**patterns** themselves (dynamic theming, variants, keyframes, the `&&` specificity trick,
encapsulation) live in the `sanity-plugin-best-practices` skill's
[styling reference](../sanity-plugin-best-practices/references/styling.md) — read it first and defer
to it for pattern details. For monorepo-specific policy (one plugin per PR, never during a transfer,
which plugins are reference implementations), see `AGENTS.md` →
`Migrating plugin styling off styled-components`.

## Ground rules

- **Identical visual output is the goal.** This is a refactor, not a redesign — every rule, theme
  token, and specificity outcome must be preserved. Verify the result against the original rendering
  before opening the PR.

## Step 1: Inventory

Find every styled-components usage in the workspace and classify it before touching code:

```bash
rg "styled-components" <workspace>/src
```

| Usage                                               | Migration target                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Static `styled(Primitive)` / `styled.div`           | `style()` in a colocated `.css.ts` + thin wrapper component (or plain `className`) |
| Theme reads (`({theme}) => theme.sanity...`)        | `createVar()` + `assignInlineVars()` + `useTheme_v2()`                             |
| Prop-driven variants (`$isInvalid`, `css` branches) | `styleVariants()` or conditional class composition                                 |
| `keyframes` animations                              | vanilla-extract `keyframes()`                                                      |
| Descendant selectors (`& img`, third-party classes) | class on the child directly, or `globalStyle()` scoped under a local wrapper class |
| `createGlobalStyle`                                 | `globalStyle()` (scope it — never leak outside the workspace)                      |
| `*.styles.tsx` modules                              | replaced by `.css.ts` (+ a component layer where call sites need it)               |
| Computed inline `style={{}}` objects                | static parts into `style()`, changing values via `createVar()` (Shape C below)     |

Each row's pattern is documented with examples in the
[styling reference](../sanity-plugin-best-practices/references/styling.md).

## Step 2: Migrate the code

Work component by component. Create a `.css.ts` next to each component and move its rules over. Two
real shapes cover most cases:

**Shape A — keep the component layer.** When the styled element is used like a component (composed,
given props), replace it with a `style()` rule plus a thin wrapper that keeps the same name and API,
so call sites don't change:

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
import {clsx} from 'clsx'
import type {ComponentProps} from 'react'

import {floatingCard} from './FloatingCard.css'

function StyledFloatingCard({className, ...props}: ComponentProps<typeof Card>) {
  return <Card {...props} className={clsx(floatingCard, className)} />
}
```

Type the wrapper with `ComponentProps<typeof Primitive>` (or `ComponentProps<'div'>`) and never use
`forwardRef` — `ref` is a regular prop on React 19. **Merge, don't clobber:** a fixed
`className={floatingCard}` after `{...props}` silently drops a `className` a caller passes in. Pull
`className` out of props and merge it with `clsx(floatingCard, className)` (any classnames helper —
`clsx`, `classnames` — or a `` `${floatingCard} ${className ?? ''}` `` template literal works) so the
wrapper's class is always applied while still honoring the caller's. See
[Keep the component layer](../sanity-plugin-best-practices/references/styling.md#keep-the-component-layer-encapsulation).

**Shape B — flatten single-use wrappers.** When the styled element was an internal, single-use
`styled.div` with no meaningful API, put the class directly on the element. Descendant selectors
like `& img { ... }` usually migrate best by styling the child directly when you render it yourself:

```tsx
// Before: <MapDiffImage><img ... /></MapDiffImage> where MapDiffImage = styled.div`& img {...}`
<img className={mapDiffImage} alt="" src={url} height={280} width={500} />
```

**Shape C — dynamic values through CSS variables.** When a value varies per instance, with
props/state, or reads the theme, keep the static parts in `style()` and bridge only the changing
values through `createVar()` + `assignInlineVars()` (from `@vanilla-extract/dynamic`). This also
migrates computed inline `style={{}}` objects — hoist the static properties into the `.css.ts` and
keep only the variables inline:

```ts
// Checkboard.css.ts
import {createVar, style} from '@vanilla-extract/css'

export const borderRadiusVar = createVar()
export const backgroundImageVar = createVar()

export const checkboard = style({
  borderRadius: borderRadiusVar,
  position: 'absolute',
  inset: 0,
  background: backgroundImageVar,
})
```

```tsx
// Checkboard.tsx — before: <div style={{borderRadius, position: 'absolute', inset: 0, background}} />
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {backgroundImageVar, borderRadiusVar, checkboard} from './Checkboard.css'

function Checkboard({borderRadius, background}: {borderRadius?: string; background?: string}) {
  return (
    <div
      className={checkboard}
      style={assignInlineVars({
        [borderRadiusVar]: borderRadius,
        [backgroundImageVar]: background ? `url(${background}) center left` : undefined,
      })}
    />
  )
}
```

`assignInlineVars` omits `undefined` values, so one class serves every instance. Theme tokens flow
the same way: read them with `useTheme_v2()` in a small wrapper and assign them to variables.

For everything else — variants (`styleVariants`), keyframes, theming third-party widgets'
classes, and overriding a `@sanity/ui` primitive's own styles (the `selectors: {'&&': {...}}`
trick) — follow the corresponding section of the
[styling reference](../sanity-plugin-best-practices/references/styling.md). Where styled-components
silently won specificity battles via CSSOM insertion order, you may need `&&` to match the original
rendering.

Delete the `*.styles.tsx` modules (and their `styled-components` imports) as they empty out.

## Step 3: Switch the build config

In the workspace's `tsdown.config.ts`, drop `styledComponents: true` and add `vanillaExtract: true`:

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

In the workspace's `package.json`:

- **Add** dev dependencies `"@sanity/vanilla-extract-vite-plugin": "catalog:"` and
  `"@vanilla-extract/css": "catalog:"`. Both are build-time only — never runtime `dependencies`.
  (If the workspace uses `assignInlineVars`, add `"@vanilla-extract/dynamic": "catalog:"` under
  `dependencies` — that one is a small runtime helper.)
- **Remove** the `styled-components` entry from `peerDependencies`, and any
  `babel-plugin-styled-components` devDependency.
- **Peer alignment:** when the workspace depends on `@sanity/ui` (which peers on styled-components),
  removing the `"styled-components": "catalog:"` devDependency can make pnpm resolve a separate
  styled-components copy, forking the workspace's `sanity` peer variant away from the rest of the
  monorepo and breaking type-aware lint. Dropping it can be fine, but you must verify: after
  `pnpm install`, the workspace's `sanity` / `@sanity/ui` resolution strings in `pnpm-lock.yaml` must
  match other workspaces that depend on `@sanity/ui`. If they fork, keep the `catalog:`
  devDependency.

No `knip.jsonc` or catalog changes are needed — `@vanilla-extract/css` is globally ignored and all
the catalog entries already exist.

## Step 5: Register the Vite plugin for Vitest

The package-exports test resolves the workspace `exports` map, whose `.` entry points at
`./src/index.ts` — so it imports real `.css.ts` source and Vitest must compile it. Add the plugin to
the workspace's `vitest.config.ts`:

```ts
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  // ...existing test config
})
```

Use `@sanity/vanilla-extract-vite-plugin` (faster drop-in for the upstream
`@vanilla-extract/vite-plugin`). If a host app or studio already registers the Vite plugin
globally, you don't need to touch that file for the workspace under migration.

> **Optional, jsdom-only:** if the workspace has `jsdom`/`happy-dom` suites that don't assert on real
> CSS (layout, `getComputedStyle`), you can skip runtime style injection with
> `setupFiles: ['@vanilla-extract/css/disableRuntimeStyles']`. This does **not** replace the Vite
> plugin, is irrelevant under the default `node` environment, and is opted into per workspace — never
> monorepo-wide. See
> [Disabling runtime styles in tests](../sanity-plugin-best-practices/references/styling.md#disabling-runtime-styles-in-tests)
> in the styling reference.

## Step 6: Build and update the exports snapshot

```bash
pnpm install
pnpm build --filter=<workspace-name>
```

Check the output: `dist/bundle.css` must contain every migrated rule, and `dist/index.js` must
import it. Then update the package-exports inline snapshot, which gains a `"./bundle.css"` entry:

```bash
pnpm test -u --project <workspace-name>
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

Then verify **visual fidelity** manually: exercise the workspace's UI and compare against the
pre-migration rendering — theme tokens, spacing, stacking, hover/sticky/fixed behavior. If an
override no longer takes effect, reach for the `&&` trick rather than `!important`.

Optionally lock the migration in: once the workspace no longer imports `styled-components`, a
`no-restricted-imports` ban in a workspace-level lint override keeps it from creeping back.

## Step 8: Add a changeset

One patch changeset for the migrated workspace:

```markdown
---
'<workspace-name>': patch
---

Migrate styling from styled-components to vanilla-extract (zero-runtime CSS)
```

## Checklist

- [ ] Every `styled-components` import in `src/` removed; `.styles.tsx` modules deleted
- [ ] `.css.ts` files colocated with their components; component layer preserved where call sites
      need it
- [ ] `tsdown.config.ts`: `styledComponents` removed, `vanillaExtract: true` added
- [ ] `package.json`: vanilla-extract devDeps added; `styled-components` peer removed; `sanity` /
      `@sanity/ui` peer variants verified aligned in `pnpm-lock.yaml`
- [ ] `vitest.config.ts` registers `vanillaExtractPlugin()`
- [ ] `dist/bundle.css` emitted with all rules; package-exports snapshot updated
- [ ] `pnpm format` / `pnpm lint` / `pnpm knip` / `pnpm build` / `pnpm test run` all pass
- [ ] Visual fidelity verified against the pre-migration rendering
- [ ] Patch changeset added
