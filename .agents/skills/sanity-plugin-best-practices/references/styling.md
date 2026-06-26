# Styling and CSS in Plugins

How to style plugin UI without paying an unnecessary runtime cost or breaking Studio theming.

## Priority order

In **greenfield** plugin code, [vanilla-extract](https://vanilla-extract.style) is the styling
solution for everything you author — both static and dynamic styles. It compiles to a static
stylesheet at build time (zero per-render and per-instance runtime cost), produces type-safe,
locally-scoped class names, and lives next to the component in a `.css.ts` file.
`@sanity/google-maps-input` is the reference implementation (migrated in
[PR #1417](https://github.com/sanity-io/plugins/pull/1417)).

Decide as follows:

1. **vanilla-extract `style()`** — for static styles (the common case).
2. **vanilla-extract `createVar()` + `assignInlineVars()`** — for styles that must read the live
   `@sanity/ui` theme, or vary with props or state.
3. **Import a third-party `.css`** once at module scope — for prebuilt stylesheets you don't author
   (katex, easymde, react-photo-album).
4. **`styled-components`** — **brownfield only.** Existing plugins keep it; do not reach for it in
   new code. See [Brownfield only: styled-components](#brownfield-only-styled-components).
5. **Never** raw `<style>` tags or runtime stylesheet injection from a component.

> There is essentially no reason to start new code on `styled-components`, even when the plugin is
> built on `@sanity/ui` (most are). Using `@sanity/ui` does not make `styled-components` a good fit
> for customizing it or reading its theme: read tokens with the `useTheme()` hook and forward them
> into vanilla-extract instead (see [Dynamic styling](#dynamic-styling-with-vanilla-extract)).

---

## Anti-pattern: raw `<style>` tags

Do not render `<style>` tags from a component, inject CSS through `dangerouslySetInnerHTML`, or
append a `<style>` / `<link>` element to `document.head` from render or an effect.

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

> Note: `dangerouslySetInnerHTML` is fine for rendering already-sanitized **content** (for example
> `sanity-plugin-latex-input` uses it for KaTeX's `renderToString` output). The anti-pattern is using
> it — or `<style>` tags — to ship **CSS rules**.

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
element.

### vanilla-extract setup

vanilla-extract needs a build/transform step. Mirror `@sanity/google-maps-input`:

**1. Enable the pkg-utils Rollup integration** so the build extracts a `dist/bundle.css`:

```ts
// plugins/@sanity/google-maps-input/package.config.ts
import config from '@repo/package.config'
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  ...config,
  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '19'},
  rollup: {vanillaExtract: true},
})
```

**2. Add the `./bundle.css` export and build deps** in `package.json`. The built entry loads the
stylesheet, so consumers need no changes; the `node` / `default` conditions point at a JS shim so
SSR/Node imports don't choke on a `.css` file:

```json
{
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "development": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./bundle.css": {
      "browser": "./dist/bundle.css",
      "style": "./dist/bundle.css",
      "node": "./dist/bundle.css.js",
      "default": "./dist/bundle.css.js"
    },
    "./package.json": "./package.json"
  },
  "devDependencies": {
    "@vanilla-extract/css": "catalog:",
    "@vanilla-extract/vite-plugin": "catalog:"
  }
}
```

Add the matching `./bundle.css` entry under `publishConfig.exports` too. `@vanilla-extract/css` is
**build-time only** — its `style()` / `createVar()` calls compile away — so it stays a
`devDependency`, never a runtime `dependency`.

**3. Register the Vite plugin** wherever the plugin's source `.css.ts` is compiled live: the
plugin's own `vitest.config.ts`, and the test studio (which consumes the plugin's `source` export in
dev):

```ts
// plugins/@sanity/google-maps-input/vitest.config.ts
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  // ...
})
```

```ts
// dev/test-studio/sanity.cli.ts — add vanillaExtractPlugin() to the studio's Vite plugins
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin'

export default defineCliConfig({
  // ...
  vite: {
    plugins: [vanillaExtractPlugin()],
  },
})
```

Finally, the catalog carries the build deps (add them if missing) and knip ignores the
build-time-only css package:

```yaml
# pnpm-workspace.yaml
catalog:
  '@vanilla-extract/css': ^1.20.1
  '@vanilla-extract/vite-plugin': ^5.2.2
```

```jsonc
// knip.jsonc
"ignoreDependencies": ["@vanilla-extract/css"]
```

---

## Dynamic styling with vanilla-extract

When a style must follow the live `@sanity/ui` theme, or change with props or state, you do **not**
need `styled-components`. Declare a CSS variable with `createVar()`, reference it from a static
`style()` rule, then assign its value at runtime with `assignInlineVars()` from
`@vanilla-extract/dynamic` on the element's `style` prop. Read theme tokens with `@sanity/ui`'s
`useTheme()` hook.

```ts
// MarkdownInput.css.ts
import {createVar, style} from '@vanilla-extract/css'

export const fg = createVar()
export const border = createVar()

export const editor = style({
  color: fg,
  borderColor: border,
  backgroundColor: 'inherit',
})
```

```tsx
// MarkdownInput.tsx
import {Box, useTheme} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {border, editor, fg} from './MarkdownInput.css'

export function MarkdownInput() {
  const theme = useTheme()
  return (
    <Box
      className={editor}
      style={assignInlineVars({
        [fg]: theme.sanity.color.card.enabled.fg,
        [border]: theme.sanity.color.card.enabled.border,
      })}
    >
      ...
    </Box>
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

## Brownfield only: styled-components

`styled-components` is the Studio's own styling library and a `@sanity/ui` peer dependency, so
existing plugins that use it still work correctly — they share a single managed stylesheet and the
Studio theme. **Keep working brownfield code on `styled-components`; do not rewrite it
speculatively.** A migration to vanilla-extract must be done carefully — and usually in its own PR —
to preserve visual fidelity and avoid regressions. The `plugin-transfer` skill makes this a rule:
transfers never migrate styling in the initial port.

For **new** code, prefer vanilla-extract (above). The notes below apply only when maintaining a
plugin that is already on `styled-components`:

**Import named, not default** (`import styled from 'styled-components'` was removed — see the
`@sanity/code-input` changelog):

```ts
import {css, keyframes, styled} from 'styled-components'
```

**Extend `@sanity/ui` primitives** rather than bare DOM elements, and **read theme tokens** with the
`({theme}) => ...` accessor:

```tsx
// plugins/sanity-plugin-markdown/src/components/MarkdownInput.tsx
import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

const MarkdownInputStyles = styled(Box)`
  & .CodeMirror.CodeMirror {
    color: ${({theme}) => theme.sanity.color.card.enabled.fg};
    border-color: ${({theme}) => theme.sanity.color.card.enabled.border};
    background-color: inherit;
  }
`
```

### Dependency setup (brownfield)

Declare `styled-components` so the plugin resolves to the workspace override
(`styled-components: npm:@sanity/styled-components@latest`). This guarantees a **single**
styled-components instance shared with the Studio — without it, pnpm may install a separate copy and
theming/SSR break.

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

- It is a **peer dependency** (the host Studio provides it) — never list it under `dependencies`.
- The `catalog:` devDependency pins the same version the rest of the monorepo uses and keeps the
  plugin on the shared `sanity` peer variant (see the `plugin-transfer` skill for why duplicate
  variants break type-aware lint).

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

- `vercel-react-best-practices` → `rules/js-batch-dom-css.md` (batch DOM/CSS writes, prefer classes),
  `rules/rendering-hoist-jsx.md`, and the rendering section generally.
- `plugin-transfer` skill → keep transferred plugins on `styled-components`; dependency alignment for
  `styled-components` and `sanity` peers.
- [vanilla-extract](https://vanilla-extract.style) — `style`, `createVar`, `styleVariants`,
  `keyframes`, `globalStyle`; and
  [`@vanilla-extract/dynamic`](https://vanilla-extract.style/documentation/packages/dynamic/) for
  `assignInlineVars`.
- [`@sanity/ui`](https://www.sanity.io/ui) for theme tokens, the `useTheme()` hook, and primitives.
