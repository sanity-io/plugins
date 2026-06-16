# Styling and CSS in Plugins

How to style plugin UI without paying an unnecessary runtime cost or breaking Studio theming.

## Priority order

Pick the cheapest option that satisfies the requirement:

1. **Static CSS** (preferred) — plain CSS authored or imported once at module scope.
2. **`styled-components`** — only for styles that must be computed at runtime (theme, props, state).
3. **Never** raw `<style>` tags or runtime stylesheet injection from a component.

Each step down adds work the browser repeats; only move down when the step above genuinely cannot
express the requirement.

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
  `dangerouslySetInnerHTML`) is an injection vector and defeats the sanitization styled-components
  provides.

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

## Preferred: static CSS

If the styles are known ahead of time, ship them as static CSS. The bundler emits one stylesheet,
the browser parses it once and caches it, and there is no per-render or per-instance cost.

Static CSS is also how third-party component CSS is consumed in this repo — import it once at the
module top:

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

**When to use:** any styling that does not depend on runtime values — layout, spacing, third-party
widget theming, and most component chrome.

**Trade-off:** static CSS cannot read the live `@sanity/ui` theme. If a rule must follow theme
tokens or change with props/state, use `styled-components` (below) rather than reaching for a raw
`<style>` tag.

---

## Runtime styling: styled-components

When a style genuinely must be computed at runtime — it reads the Studio theme, or varies with props
or state — use `styled-components`. It is the Studio's own styling library and an existing peer
dependency, so plugins share a single managed stylesheet (one injected `<style>` tag that
styled-components maintains via the CSSOM, deduplicated across instances) and the same theme.

**Import named, not default** (`import styled from 'styled-components'` was removed — see the
`@sanity/code-input` changelog):

```ts
import {css, keyframes, styled} from 'styled-components'
```

**Extend `@sanity/ui` primitives** instead of styling bare DOM elements:

```tsx
// plugins/sanity-plugin-workflow/src/components/FloatingCard.tsx
import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

const StyledFloatingCard = styled(Card)`
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1000;
`
```

**Read theme tokens** with the `({theme}) => ...` accessor rather than hardcoding values:

```tsx
// plugins/sanity-plugin-graph-view/src/tool/GraphViewStyle.tsx
export const HoverNode = styled.div`
  font-family: ${({theme}) => theme.fonts.text.family};
  bottom: ${({theme}) => theme.space[0]}px;
  border-radius: ${({theme}) => theme.radius[2]}px;
  padding: ${({theme}) => theme.space[2]}px;
`
```

**Use the `css` helper** for conditional or composed style blocks, and to theme third-party widget
classes from within the plugin's own scoped wrapper:

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

**Use `keyframes`** for animation instead of injecting `@keyframes` through a `<style>` tag (see
`@sanity/assist` and `sanity-plugin-asset-source-unsplash`).

---

## Dependency setup

Declare `styled-components` so the plugin resolves to the workspace override
(`styled-components: npm:@sanity/styled-components@latest`). This guarantees a **single**
styled-components instance shared with the Studio — without it, pnpm may install a separate copy and
theming/SSR break.

In the plugin `package.json`:

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
user-picked color on one element). For anything static or repeated, prefer `@sanity/ui` props, a
CSS class, or `styled-components` — inline styles are recreated every render and cannot use theme
tokens, pseudo-classes, or media queries.

Never interleave inline style writes with layout reads (`offsetWidth`, `getBoundingClientRect()`):
that forces synchronous reflows. See the `vercel-react-best-practices` rule `js-batch-dom-css`
("Avoid Layout Thrashing").

---

## See also

- `vercel-react-best-practices` → `rules/js-batch-dom-css.md` (batch DOM/CSS writes, prefer classes),
  `rules/rendering-hoist-jsx.md`, and the rendering section generally.
- `plugin-transfer` skill → dependency alignment for `styled-components` and `sanity` peers.
- [`@sanity/ui`](https://www.sanity.io/ui) for theme tokens and primitives.
