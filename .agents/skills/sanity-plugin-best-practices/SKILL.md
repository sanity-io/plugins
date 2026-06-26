---
name: sanity-plugin-best-practices
description: Anti-patterns and best practices for building Sanity Studio plugins in this monorepo. Use when writing, reviewing, or refactoring plugin code under plugins/ — especially for styling/CSS, component performance, and runtime cost. Triggers on vanilla-extract, raw <style> tags, styled-components, theming, inline styles, or questions about how plugins should be structured here.
metadata:
  author: Sanity.io
  version: '1.1.0'
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

| Area            | What it covers                                                                                 | Reference                                          |
| --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Styling and CSS | Use vanilla-extract (static + dynamic) for new styling; `styled-components` is brownfield-only | [`references/styling.md`](./references/styling.md) |

> This skill is intended to grow. When you find a plugin pattern worth standardizing (or an
> anti-pattern worth banning), add a focused reference file and a row to the table above rather than
> bloating this entry point.

## Styling: the one-line rule

For new (greenfield) code, [vanilla-extract](https://vanilla-extract.style) is the styling solution
for everything you author — it compiles to a static stylesheet (zero per-render and per-instance
cost), is type-safe and scoped, and lives in a `.css.ts` next to the component:

1. **vanilla-extract `style()`** — static styles (the common case).
2. **vanilla-extract `createVar()` + `assignInlineVars()`** — dynamic styles that read the live
   `@sanity/ui` theme (via the `useTheme()` hook) or vary with props/state. No `styled-components`
   needed.
3. **Import a third-party `.css`** once at module scope — for prebuilt stylesheets you don't author
   (katex, easymde, …).
4. **`styled-components`** — **brownfield only.** Existing plugins keep it; never introduce it in new
   code, and don't migrate styling speculatively (do it in a dedicated PR with care for visual
   fidelity).
5. **Never** render raw `<style>` tags (in JSX, via `dangerouslySetInnerHTML`, or by appending a
   `<style>`/`<link>` to `document.head` from a component). They re-parse on every render, duplicate
   per instance, bypass the theme, and are an injection risk.

See [`references/styling.md`](./references/styling.md) for the full rationale and examples.

## General principles

- **Build on `@sanity/ui`.** Compose Studio primitives (`Box`, `Card`, `Flex`, `Stack`, `Text`,
  `Button`, …) and read design tokens with the `useTheme()` hook (`theme.sanity.color...`,
  `theme.sanity.space[...]`, `theme.sanity.radius[...]`) instead of hardcoding colors, spacing, or
  fonts.
- **Style with the priority above:** vanilla-extract for all new styling — `style()` for static,
  `createVar()` + `assignInlineVars()` (from `@vanilla-extract/dynamic`) for dynamic; never raw
  `<style>` tags.
- **`styled-components` is brownfield only.** Keep existing usage; don't add it to new code. When
  maintaining it, import named (`import {css, keyframes, styled} from 'styled-components'`) and
  declare the shared peer so the plugin resolves to the workspace `@sanity/styled-components`
  override (a single instance — required for theming and SSR). See
  [`references/styling.md`](./references/styling.md#brownfield-only-styled-components).
- **Use `lodash-es`, never `lodash`** (matches `AGENTS.md`).
- **Apply the React performance rules** from `vercel-react-best-practices` (don't define components
  inside components, batch DOM/CSS writes, hoist static JSX, etc.).
