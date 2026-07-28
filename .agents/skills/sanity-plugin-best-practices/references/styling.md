# Styling and CSS in Plugins

How to style plugin UI without paying an unnecessary runtime cost or breaking Studio theming.

## Priority order

[vanilla-extract](https://vanilla-extract.style) is the styling solution for everything you author in
this monorepo — both static and dynamic styles, in new plugins and in existing ones (which are being
migrated off `styled-components`). It compiles to a static stylesheet at build time (zero per-render
and per-instance runtime cost), produces type-safe, locally-scoped class names, and lives next to the
component in a `.css.ts` file. `@sanity/google-maps-input` is the reference implementation (migrated
in [PR #1417](https://github.com/sanity-io/plugins/pull/1417)).

Decide as follows:

1. **vanilla-extract `style()`** — for static styles (the common case).
2. **vanilla-extract `createVar()` + `assignInlineVars()`** — for styles that must read the live
   `@sanity/ui` theme, or vary with props or state.
3. **Import a third-party `.css`** once at module scope — for prebuilt stylesheets you don't author
   (katex, easymde, react-photo-album).
4. **Never** render raw `<style>` tags or insert CSS with the `useInsertionEffect` hook. If
   installing CSS in JS is absolutely necessary — for example the CSS comes from runtime data and can
   be _any_ CSS — use `styled-components`, the most performant way to do CSS-in-JS (though we try our
   best to never have to reach for CSS-in-JS).

`styled-components` is otherwise **not** one of the options above. It is the Studio's legacy styling
library — still present in some plugins, but on its way out. Don't add it for ordinary styling, and
migrate existing styling usage to vanilla-extract (see
[Migrating off styled-components](#migrating-off-styled-components)). Its only sanctioned use is the
last-resort CSS-in-JS escape hatch in rule 4.

> There is no reason to write `styled-components`, even when the plugin is built on `@sanity/ui`
> (most are). Using `@sanity/ui` does not make `styled-components` a good fit for customizing it or
> reading its theme: read tokens with the `useTheme_v2()` hook and forward them into vanilla-extract
> instead (see [Dynamic styling](#dynamic-styling-with-vanilla-extract)).

---

## Anti-pattern: raw `<style>` tags

Do not render `<style>` tags from a component, inject CSS through `dangerouslySetInnerHTML`, append a
`<style>` / `<link>` element to `document.head`, or insert CSS with the `useInsertionEffect` hook —
whether from render or an effect.

**Why it is bad:**

- **Per-render cost.** A `<style>` element in JSX is re-evaluated on every render. The browser
  re-parses the CSS text and recomputes styles, which can force reflows in a Studio that re-renders
  frequently.
- **Per-instance duplication.** Every mounted copy of the component injects its own identical
  stylesheet. Ten inputs on a page means ten duplicated rule sets in the DOM with no deduplication.
- **No theme integration.** Hardcoded CSS ignores the active `@sanity/ui` theme (light/dark,
  spacing, radii, brand color), so the plugin looks foreign and breaks when the Studio theme
  changes.
- **Specificity and global leakage.** Hand-written selectors easily leak outside the plugin or fight
  the Studio's own styles, leading to brittle `!important` chains.
- **Injection risk.** Interpolating values into raw CSS text (especially via
  `dangerouslySetInnerHTML`) is an injection vector.

**Incorrect (inline `<style>` tag, re-parsed every render, duplicated per instance):**

```tsx
function Callout({color}: {color: string}) {
  return (
    <div className="callout">
      <style>{`
        .callout { padding: 8px; border-radius: 4px; }
        .callout { background: ${color}; }
      `}</style>
      ...
    </div>
  )
}
```

**Incorrect (`dangerouslySetInnerHTML` for CSS — injection-prone, no dedup):**

```tsx
function Callout({css}: {css: string}) {
  return <style dangerouslySetInnerHTML={{__html: css}} />
}
```

**Incorrect (manually appending a stylesheet from an effect — runs per mount, leaks globally):**

```tsx
function useInjectStyles(css: string) {
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
    return () => el.remove()
  }, [css])
}
```

**Incorrect (`useInsertionEffect` to inject a stylesheet — still hand-rolled CSS-in-JS):**

```tsx
function useInjectStyles(css: string) {
  useInsertionEffect(() => {
    const el = document.createElement('style')
    el.textContent = css
    document.head.appendChild(el)
    return () => el.remove()
  }, [css])
}
```

> Note: `dangerouslySetInnerHTML` is fine for rendering already-sanitized **content** (for example
> `sanity-plugin-latex-input` uses it for KaTeX's `renderToString` output). The anti-pattern is using
> it — or `<style>` tags — to ship **CSS rules**.

> **The one escape hatch.** If you genuinely must install CSS from JS — the CSS is built from runtime
> data and can be _any_ CSS, so a fixed `style()` + `createVar()` cannot express it — reach for
> `styled-components` instead of hand-rolling injection. It is the most performant CSS-in-JS option
> and inserts styles correctly (via `useInsertionEffect` internally, deduplicated through the CSSOM).
> This is genuinely rare — exhaust vanilla-extract first; we try our best to never need CSS-in-JS.

---

## Preferred: vanilla-extract (zero-runtime CSS)

Author styles in a colocated `.css.ts` file with `style()` from `@vanilla-extract/css`. Each call
returns a unique, scoped class-name string; pass it to a component's `className`. The styles are
extracted to a single static stylesheet at build time, so there is no per-render or per-instance
cost and no theme or specificity leakage.

```ts
// plugins/@sanity/google-maps-input/src/input/StaticMapPreview.css.ts
import {style} from '@vanilla-extract/css'

export const staticMapContainer = style({
  cursor: 'pointer',
})
export const staticMapImage = style({
  width: '100%',
  height: 'auto',
  display: 'block',
  verticalAlign: 'top',
})
```

```tsx
// plugins/@sanity/google-maps-input/src/input/StaticMapPreview.tsx
import {StaticMap} from '@vis.gl/react-google-maps'

import {staticMapContainer, staticMapImage} from './StaticMapPreview.css'

export function StaticMapPreview({url}: {url: string}) {
  return (
    <div className={staticMapContainer}>
      <StaticMap className={staticMapImage} url={url} />
    </div>
  )
}
```

Compose `@sanity/ui` primitives and pass the class through their `className` prop just like a DOM
element. For anything reused — or any `@sanity/ui` primitive you restyle — wrap it in its own small
component rather than spreading `className` across the tree (see
[Keep the component layer](#keep-the-component-layer-encapsulation)).

### vanilla-extract setup

vanilla-extract needs a build/transform step. Mirror `@sanity/google-maps-input`:

**1. Enable the tsdown integration** so the build extracts a `dist/bundle.css`:

```ts
// plugins/@sanity/google-maps-input/tsdown.config.ts
import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

export default defineConfig({
  reactCompiler: true,
  vanillaExtract: true,
}) satisfies Promise<UserConfig>
```

This also wires up the `./bundle.css` export in `package.json` automatically, keeping it in sync on
every build — nothing to hand-edit there.

**2. Add the build deps** in `package.json`:

```json
{
  "devDependencies": {
    "@sanity/vanilla-extract-vite-plugin": "catalog:",
    "@vanilla-extract/css": "catalog:"
  }
}
```

`@vanilla-extract/css` is **build-time only** — its `style()` / `createVar()` calls compile away —
so it stays a `devDependency`, never a runtime `dependency`.

**3. Register the Vite plugin in the plugin's own `vitest.config.ts`.** The package-exports test
resolves this workspace package's own `exports` map — whose `.` entry points at `./src/index.ts` for
monorepo-internal dev consumption, not `dist/index.js` — so it transitively imports real `.css.ts`
source and needs the plugin to compile it. Use `@sanity/vanilla-extract-vite-plugin` instead of the
upstream `@vanilla-extract/vite-plugin` — it's faster. The exported `vanillaExtractPlugin()` API is a
drop-in match:

```ts
// plugins/@sanity/google-maps-input/vitest.config.ts
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  // ...
})
```

The test studio already registers this plugin globally in `sanity.cli.ts` — you don't need to touch
that file for a new plugin.

#### Disabling runtime styles in tests

These are **separate** concerns — do not confuse them:

| Concern                                      | What solves it                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `.css.ts` must compile / class names resolve | Keep `vanillaExtractPlugin()` in `vitest.config.ts` (required)          |
| Avoid injecting CSS into jsdom for speed     | Optional: `'@vanilla-extract/css/disableRuntimeStyles'` in `setupFiles` |

In browser-like environments (`jsdom` / `happy-dom`), vanilla-extract injects real styles into the
document when `.css.ts` runs. That is often desirable, but it can slow tests down. If a suite does
**not** need styles available, add
[`disableRuntimeStyles`](https://vanilla-extract.style/documentation/test-environments/#disabling-runtime-styles)
to `setupFiles` to skip style creation.

Nuance for this monorepo:

1. **`disableRuntimeStyles` does not replace the Vite plugin.** Package-exports tests and any
   import path that pulls `.css.ts` source still need `vanillaExtractPlugin()`.
2. **Only relevant under `jsdom` / `happy-dom`.** Default Vitest env here is `node` (see
   `AGENTS.md` Testing). Under `node` there is no document to inject into — do not add a setup
   import just because a plugin uses vanilla-extract.
3. **Prefer disable** for most jsdom unit/render tests that only need class-name strings, DOM
   structure, or behavior — not computed styles.
4. **Do not disable** when a test asserts layout, CSS-driven visibility, `getComputedStyle`, or
   otherwise depends on real rules being present.
5. **Opt in per plugin** via that plugin’s `setupFiles`. Do not enable it monorepo-wide, and do
   not bake it into the plugin generator template.

Example when you _do_ opt in — `setupFiles` entries resolve through Vite, so the bare package
specifier works directly (no wrapper `vitest.setup.ts` needed):

```ts
// vitest.config.ts
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  test: {
    environment: 'jsdom',
    // only when tests don't need real CSS
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles'],
    // ...
  },
})
```

Finally, the catalog carries the build deps (add them if missing) and knip ignores the
build-time-only css package:

```yaml
# pnpm-workspace.yaml
catalog:
  '@sanity/vanilla-extract-vite-plugin': ^0.1.0
  '@vanilla-extract/css': ^1.20.1
```

```jsonc
// knip.jsonc
"ignoreDependencies": ["@vanilla-extract/css"]
```

> **New plugins get this for free.** `pnpm generate "new plugin"` wires all of the above
> automatically when you opt into styling — the `rollup` option, the `./bundle.css` export, the
> catalog devDeps, the `vitest.config.ts` plugin, and an example `Tool.css.ts`. The test studio
> already registers the Vite plugin globally, so generated plugins render in `pnpm dev` with no extra
> steps.

---

## Dynamic styling with vanilla-extract

When a style must follow the live `@sanity/ui` theme, or change with props or state, you do **not**
need `styled-components`. Declare a CSS variable with `createVar()`, reference it from a static
`style()` rule, then assign its value at runtime with `assignInlineVars()` from
`@vanilla-extract/dynamic` on the element's `style` prop. Read theme tokens with `@sanity/ui`'s
`useTheme_v2()` hook (the v2 theme API — `color`, `space`, `radius`, `font`) and bridge them in a
small wrapper component — the `ResultViewWrapper` pattern from
[sanity-io/sanity#13333](https://github.com/sanity-io/sanity/pull/13333):

```ts
// ResultView.css.ts
import {createVar, style} from '@vanilla-extract/css'

export const codeFamilyVar = createVar()
export const space2Var = createVar()
export const syntaxStringVar = createVar()

export const resultViewWrapper = style({
  fontFamily: codeFamilyVar,
  padding: space2Var,
  color: syntaxStringVar,
})
```

```tsx
// ResultView.tsx
import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ReactNode} from 'react'

import {codeFamilyVar, resultViewWrapper, space2Var, syntaxStringVar} from './ResultView.css'

function ResultViewWrapper({children}: {children: ReactNode}) {
  const {color, font, space} = useThemeV2()

  return (
    <div
      className={resultViewWrapper}
      style={assignInlineVars({
        [codeFamilyVar]: font.code.family,
        [space2Var]: `${rem(space[2])}`,
        [syntaxStringVar]: color.syntax.string,
      })}
    >
      {children}
    </div>
  )
}
```

`assignInlineVars` only emits the variables you pass (a `null` / `undefined` value is omitted), so
one class can be reused with different runtime values across instances. The variable definitions
stay in the static stylesheet; only the few changing values ride along as inline custom properties.
The same applies to prop- or state-driven values — pass them through `assignInlineVars` instead of
branching on a styled-components prop.

> **Dependency note:** unlike `@vanilla-extract/css`, `@vanilla-extract/dynamic` is a small (~1 kB)
> **runtime** helper, so a plugin that uses it lists it under `dependencies` (not `devDependencies`)
> and adds a catalog entry:
>
> ```yaml
> # pnpm-workspace.yaml
> catalog:
>   '@vanilla-extract/dynamic': ^2.1.5
> ```

For the remaining things `styled-components` was used for in this repo:

- **Variants / conditional styles** → `styleVariants({primary: {...}, critical: {...}})`, then pick
  the class by key. Plain composition is `style([base, extra])`.
- **Animations** → `keyframes()` from `@vanilla-extract/css` (returns a name you reference in
  `animationName`), instead of injecting `@keyframes` through a `<style>` tag.
- **Theming a third-party widget's own classes** (e.g. CodeMirror/EasyMDE) → `globalStyle()` scoped
  under a local wrapper class so it cannot leak, bridging theme values through a CSS variable:

  ```ts
  import {createVar, globalStyle, style} from '@vanilla-extract/css'

  export const fg = createVar()
  export const markdownInput = style({})

  globalStyle(`${markdownInput} .CodeMirror`, {
    color: fg,
  })
  ```

  Set `fg` on the wrapper element with `assignInlineVars` exactly as above; the descendant inherits
  it.

---

## Keep the component layer (encapsulation)

vanilla-extract hands you a class-name string, not a component — but a migration must **not** turn
that into raw `className=` props sprinkled across the tree. A `styled(Box)` element already _is_ a
named component with its own API; replacing it with `<Box className={...}>` at every call site leaks
styling details into the markup and leaves the composition uglier than before. **The component
composition should be as clean as it was with `styled-components`, or cleaner.**

Wrap each styled element in a small component (keep it next to the `.css.ts`, e.g. in a
`*.styled.tsx`) that spreads props onto the underlying `@sanity/ui` primitive or DOM element and
applies the class. The import and JSX stay identical to the styled-components version — callers never
touch a class name.

Given a shared stylesheet:

```ts
// Component.css.ts
import {style} from '@vanilla-extract/css'

export const dot = style({
  selectors: {
    // override the default overflow
    '&&': {overflow: 'sticky'},
  },
})
```

**Incorrect** — the class bleeds onto a raw primitive at the call site:

```tsx
// Component.tsx
import {Box} from '@sanity/ui'

import {dot} from './Component.css'

function Component() {
  return <Box className={dot} display="grid" />
}
```

**Correct** — the class is encapsulated in a `Dot` component; the composition is unchanged:

```tsx
// Component.tsx
import {Box} from '@sanity/ui'

import {dot} from './Component.css'

function Dot() {
  return <Box className={dot} display="grid" />
}

function Component() {
  return <Dot />
}
```

This is how [sanity-io/sanity#13333](https://github.com/sanity-io/sanity/pull/13333) migrated
`@sanity/vision`: each `*.styled.tsx` was kept (or recreated) as a thin component layer over the new
`*.css.ts`, preserving every export name and call site.

```tsx
// QueryErrorDialog.styled.tsx — same `ErrorCode` API as the styled-components version
import {Code} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {errorCode} from './QueryErrorDialog.css'

export function ErrorCode(props: ComponentProps<typeof Code>) {
  return <Code {...props} className={errorCode} />
}
```

- **Type the wrapper** with `ComponentProps<typeof Primitive>` (or `ComponentProps<'a'>` for a DOM
  element), and spread props **before** `className` so the wrapper owns the class.
- **Refs need no `forwardRef`** — in React 19 `ref` is a regular prop, so `ComponentProps<typeof Flex>`
  already includes it and spreading `{...props}` forwards a caller's `ref` to the wrapped primitive
  (`forwardRef` is banned by lint; see [`refs.md`](./refs.md)):

  ```tsx
  export function Root(props: ComponentProps<typeof Flex>) {
    return <Flex {...props} className={root} />
  }
  ```

- **Map a boolean/variant prop to conditional classes** instead of a styled-components transient prop
  (`$isInvalid`):

  ```tsx
  function ResultContainer({
    isInvalid,
    ...props
  }: ComponentProps<typeof Card> & {isInvalid: boolean}) {
    return (
      <Card
        {...props}
        className={isInvalid ? `${resultContainer} ${resultContainerInvalid}` : resultContainer}
      />
    )
  }
  ```

- **Map a dynamic scalar** (theme token, measured value, per-instance color) to a CSS variable with
  `assignInlineVars` inside the wrapper (see
  [Dynamic styling](#dynamic-styling-with-vanilla-extract)).

---

## Overriding `@sanity/ui` styles: the `&&` trick

With styled-components, `const OverrideCard = styled(Card)` always wins: styled-components inserts the
override's rules into the CSSOM **after** `Card`'s own rules, so equal-specificity declarations
resolve in your favor and you never think about ordering. vanilla-extract does **not** control how or
when stylesheets load, so a plain class can lose that ordering battle against the styles `@sanity/ui`
sets on its own components.

When an override doesn't take effect, double the class selector with `selectors: {'&&': {...}}` to
raise specificity (it resolves to `.cls.cls`) so it reliably wins. Use `'&&::before'` / `'&&::after'`
for pseudo-elements. (vanilla-extract's `selectors` must target the element via `&`; `&&` simply
references it twice.)

```ts
// QueryErrorDialog.css.ts (sanity-io/sanity#13333)
import {style} from '@vanilla-extract/css'

// `&&` is needed to override the color @sanity/ui's Code sets on itself.
export const errorCode = style({
  selectors: {
    '&&': {
      color: 'var(--card-muted-fg-color)',
    },
  },
})
```

```ts
// VisionGui.css.ts (sanity-io/sanity#13333) — override the background @sanity/ui's Card sets
export const header = style({
  borderBottom: '1px solid var(--card-border-color)',
  selectors: {
    '&&': {
      background: 'var(--card-bg-color)',
    },
  },
})
```

Reach for `&&` only when you are genuinely overriding a primitive's built-in style; plain `style()`
is enough for everything else.

---

## Third-party CSS imports

Prebuilt stylesheets shipped by a dependency are consumed by importing the `.css` once at module
scope — you are not authoring these, so vanilla-extract does not apply:

```ts
// plugins/sanity-plugin-latex-input/src/components/LatexPreview.tsx
import 'katex/dist/katex.min.css'
```

```ts
// plugins/sanity-plugin-markdown/src/index.ts
import 'easymde/dist/easymde.min.css'
```

```ts
// plugins/sanity-plugin-asset-source-unsplash/src/components/UnsplashPhotoGallery.tsx
import 'react-photo-album/rows.css'
```

TypeScript needs an ambient module declaration to allow CSS imports. Add a `css.d.ts` next to the
source (this is the existing pattern):

```ts
// plugins/sanity-plugin-latex-input/src/css.d.ts
declare module 'katex/dist/katex.min.css'
```

---

## Migrating off styled-components

`styled-components` is the Studio's legacy styling library (a `@sanity/ui` peer). It still works, but
**no new code uses it for styling and existing usage is migrated to vanilla-extract** — this section
covers the patterns; the
[`migrate-styled-components-to-vanilla-extract`](../../migrate-styled-components-to-vanilla-extract/SKILL.md)
skill covers the step-by-step procedure (config, dependencies, verification), distilled from
[PR #1417](https://github.com/sanity-io/plugins/pull/1417) and
[PR #1450](https://github.com/sanity-io/plugins/pull/1450). Don't add `styled-components` for
ordinary styling, and convert a
component's styling to vanilla-extract when you work on it rather than extending the styled-components
code. (The one usage that legitimately stays is genuinely-dynamic CSS-in-JS — arbitrary CSS built
from runtime data that no `style()` + `createVar()` can express, the escape hatch in the
[priority order](#priority-order). Ordinary styling always migrates.)

The migration is mechanical, reusing the patterns above:

- `styled(Primitive)` / `styled.div` → a `style()` rule plus a thin wrapper component that keeps the
  same name and API, so call sites don't change. See
  [Keep the component layer](#keep-the-component-layer-encapsulation).
- Theme reads (`({theme}) => theme.sanity...`) → `useTheme_v2()` + `assignInlineVars` over a
  `createVar()`. See [Dynamic styling](#dynamic-styling-with-vanilla-extract).
- `css` variants → `styleVariants`; `keyframes` → vanilla-extract `keyframes`; descendant or
  third-party selectors → `globalStyle` scoped under a wrapper class.
- Overriding a primitive's own styles often needs the `selectors: {'&&': {...}}` trick that
  styled-components got for free via CSSOM ordering (see the `&&` trick section above).

For example, the markdown CodeMirror theming moves from a `styled(Box)` template:

```tsx
// Before — styled-components
const MarkdownInputStyles = styled(Box)`
  & .CodeMirror.CodeMirror {
    color: ${({theme}) => theme.sanity.color.card.enabled.fg};
  }
`
```

to a colocated `.css.ts` with `globalStyle` + a variable set from the theme (see
[Dynamic styling](#dynamic-styling-with-vanilla-extract) for wiring the variable via `useTheme_v2()`):

```ts
// After — MarkdownInput.css.ts
import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const fg = createVar()
export const markdownInput = style({})

globalStyle(`${markdownInput} .CodeMirror.CodeMirror`, {
  color: fg,
})
```

**Migrate carefully.** The goal is identical visual output — verify the result against the original
(theme tokens, spacing, specificity). Where styled-components silently won on source order, you may
need `&&` to match. During a plugin **transfer/port**, do not migrate styling in the same PR: keep it
building as-is and do the migration in a dedicated follow-up PR (see the `plugin-transfer` skill).

> **Lock in a finished migration.** Once a plugin no longer imports `styled-components`, ban it via
> `no-restricted-imports` in `@sanity/plugin-kit/oxlint` (or a local `oxlint.config.ts` override) so it cannot creep back — this is how `@sanity/vision`
> locked in its migration in
> [sanity-io/sanity#13333](https://github.com/sanity-io/sanity/pull/13333).

### While a plugin still has styled-components

Until a plugin is fully migrated, keep its `styled-components` declaration aligned so it resolves to
a **single** instance shared with the Studio, without which pnpm may install a separate copy and
theming/SSR break:

```json
{
  "peerDependencies": {
    "styled-components": "^6.1"
  },
  "devDependencies": {
    "styled-components": "catalog:"
  }
}
```

- It is a **peer dependency** (the host Studio provides it) — never under `dependencies`.
- The `catalog:` devDependency keeps the plugin on the shared `sanity` peer variant (see the
  `plugin-transfer` skill for why duplicate variants break type-aware lint).

Once the migration is complete, remove the **peer** dependency — but keep the
`styled-components: catalog:` **devDependency** while the plugin depends on `@sanity/ui` (which
peers on styled-components). Dropping the devDependency makes pnpm resolve a separate
styled-components copy and forks the plugin's `sanity` peer variant away from the rest of the
workspace, breaking type-aware lint. All migrated plugins (`@sanity/google-maps-input`,
`sanity-plugin-workflow`, `sanity-plugin-bynder-input`) keep it.

---

## Inline `style={{}}` props

Inline styles are acceptable for a single, genuinely dynamic value (e.g. a measured `transform` or a
user-picked color on one element). When the value feeds a vanilla-extract variable, set it with
`assignInlineVars` (typed, and it strips the wrapping `var(...)` for you) rather than hand-writing
the custom property. For anything static or repeated, prefer `@sanity/ui` props or a vanilla-extract
class — plain inline styles are recreated every render and cannot use pseudo-classes or media
queries.

Never interleave inline style writes with layout reads (`offsetWidth`, `getBoundingClientRect()`):
that forces synchronous reflows. See the `vercel-react-best-practices` rule `js-batch-dom-css`
("Avoid Layout Thrashing").

---

## See also

- [`migrate-styled-components-to-vanilla-extract`](../../migrate-styled-components-to-vanilla-extract/SKILL.md)
  skill → the step-by-step procedure for migrating a plugin off styled-components (inventory,
  config, dependencies, snapshot, verification).
- `vercel-react-best-practices` → `rules/js-batch-dom-css.md` (batch DOM/CSS writes, prefer classes),
  `rules/rendering-hoist-jsx.md`, and the rendering section generally.
- `plugin-transfer` skill → don't migrate styling during a transfer (do it in a follow-up PR);
  dependency alignment for `styled-components` and `sanity` peers.
- [sanity-io/sanity#13333](https://github.com/sanity-io/sanity/pull/13333) — reference migration of
  `@sanity/vision`: the component-layer (encapsulation) pattern and the `&&` specificity trick.
- [vanilla-extract](https://vanilla-extract.style) — `style`, `createVar`, `styleVariants`,
  `keyframes`, `globalStyle`; and
  [`@vanilla-extract/dynamic`](https://vanilla-extract.style/documentation/packages/dynamic/) for
  `assignInlineVars`.
- [vanilla-extract test environments](https://vanilla-extract.style/documentation/test-environments/#disabling-runtime-styles)
  — when to use `disableRuntimeStyles` in Vitest/jsdom (see
  [Disabling runtime styles in tests](#disabling-runtime-styles-in-tests)).
- [`@sanity/ui`](https://www.sanity.io/ui) for theme tokens, the `useTheme_v2()` hook, and
  primitives.
