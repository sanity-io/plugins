---
name: sanity-plugin-best-practices
description: Anti-patterns and best practices for building Sanity Studio plugins in this monorepo. Use when writing, reviewing, or refactoring plugin code under plugins/ — especially for styling/CSS, component performance, and runtime cost. Triggers on vanilla-extract, raw <style> tags, styled-components, theming, inline styles, or questions about how plugins should be structured here.
metadata:
  author: Sanity.io
  version: '1.2.0'
---

# Sanity Plugin Best Practices

Conventions for authoring plugins in the `sanity-io/plugins` monorepo, captured as concrete
anti-patterns and the preferred approach. These rules encode what the existing plugins already do
so new and migrated code stays consistent, fast, and theme-aware.

This complements the broader React performance guide in the
[`vercel-react-best-practices`](../vercel-react-best-practices/SKILL.md) skill — read that for
general React/Next.js patterns, and this skill for plugin-specific guidance.

## When to Use This Skill

Use this skill when you are:

- Writing or reviewing a plugin component under `plugins/` (`.ts`/`.tsx`) or a test-studio example.
- Adding or changing styling: authoring `.css.ts` (vanilla-extract), reaching for `<style>` tags,
  inline `style={{}}`, CSS files, or `styled-components`.
- Migrating an external plugin into the monorepo (pair with the `plugin-transfer` skill).
- Investigating runtime cost, re-renders, or styling that does not respect the Studio theme.
- Deciding how a plugin should be structured to match the rest of the repo.

## How to Use

Read the reference file for the area you are working in. Each reference lists the anti-pattern, the
preferred approach, and `Incorrect` / `Correct` examples grounded in real plugins in this repo.

| Area            | What it covers                                                                                                                                   | Reference                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Styling and CSS | Use vanilla-extract (static + dynamic) for all plugin styling; encapsulate classes in components; migrate `styled-components` to vanilla-extract | [`references/styling.md`](./references/styling.md) |

> This skill is intended to grow. When you find a plugin pattern worth standardizing (or an
> anti-pattern worth banning), add a focused reference file and a row to the table above rather than
> bloating this entry point.

## Styling: the one-line rule

[vanilla-extract](https://vanilla-extract.style) is the styling solution for everything you author —
in new plugins and existing ones. It compiles to a static stylesheet (zero per-render and
per-instance cost), is type-safe and scoped, and lives in a `.css.ts` next to the component:

1. **vanilla-extract `style()`** — static styles (the common case).
2. **vanilla-extract `createVar()` + `assignInlineVars()`** — dynamic styles that read the live
   `@sanity/ui` theme (via the `useTheme_v2()` hook) or vary with props/state.
3. **Import a third-party `.css`** once at module scope — for prebuilt stylesheets you don't author
   (katex, easymde, …).
4. **Never** render raw `<style>` tags (in JSX, via `dangerouslySetInnerHTML`, by appending a
   `<style>`/`<link>` to `document.head`, or via `useInsertionEffect`). They re-parse on every
   render, duplicate per instance, bypass the theme, and are an injection risk. CSS-in-JS is a last
   resort: only when the CSS is genuinely dynamic (from runtime data, able to be _any_ CSS) reach for
   `styled-components` — the most performant CSS-in-JS — and we try hard never to need it.

`styled-components` is **legacy** — the Studio's old styling library, still in some plugins. Migrate
existing styling usage to vanilla-extract (carefully, preserving visual fidelity; not during a
transfer's initial port). Its only remaining sanctioned use is the last-resort CSS-in-JS escape hatch
in rule 4 (arbitrary CSS from runtime data). See
[`references/styling.md`](./references/styling.md#migrating-off-styled-components).

See [`references/styling.md`](./references/styling.md) for the full rationale and examples.

## General principles

- **Build on `@sanity/ui`.** Compose Studio primitives (`Box`, `Card`, `Flex`, `Stack`, `Text`,
  `Button`, …) and read design tokens with the `useTheme_v2()` hook (`color...`, `space[...]`,
  `radius[...]`, `font...`) instead of hardcoding colors, spacing, or fonts.
- **Style with the priority above:** vanilla-extract for all new styling — `style()` for static,
  `createVar()` + `assignInlineVars()` (from `@vanilla-extract/dynamic`) for dynamic; never raw
  `<style>` tags.
- **Encapsulate styles in components; don't scatter `className`.** Wrap each vanilla-extract class in
  a small component that spreads props onto the `@sanity/ui` primitive, keeping the same export name
  and API as the old `styled()` so call sites are unchanged — composition stays as clean as before.
  To override a primitive's own styles, use the `selectors: {'&&': {...}}` specificity trick
  (styled-components guaranteed override ordering in the CSSOM; vanilla-extract does not). See
  [`references/styling.md`](./references/styling.md#keep-the-component-layer-encapsulation).
- **`styled-components` is legacy — migrate it to vanilla-extract.** Never add it for ordinary
  styling (its only sanctioned use is the last-resort CSS-in-JS escape hatch for arbitrary runtime
  CSS); convert existing styling usage to vanilla-extract (carefully, preserving visual fidelity)
  using the patterns above. Until a plugin is fully migrated, keep its `styled-components` peer +
  `catalog:` devDependency aligned so it resolves to the workspace `@sanity/styled-components`
  override; remove them once migrated, and lock it in with `no-restricted-imports`. See
  [`references/styling.md`](./references/styling.md#migrating-off-styled-components).
- **Use `lodash-es`, never `lodash`** (matches `AGENTS.md`).
- **Apply the React performance rules** from `vercel-react-best-practices` (don't define components
  inside components, batch DOM/CSS writes, hoist static JSX, etc.).
