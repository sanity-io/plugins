---
name: sanity-plugin-best-practices
description: Anti-patterns and best practices for building Sanity Studio plugins in this monorepo. Use when writing, reviewing, or refactoring plugin code under plugins/ — especially for styling/CSS, component performance, and runtime cost. Triggers on raw <style> tags, styled-components, theming, inline styles, or questions about how plugins should be structured here.
metadata:
  author: Sanity.io
  version: '1.0.0'
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
- Adding or changing styling: reaching for `<style>` tags, inline `style={{}}`, CSS files, or
  `styled-components`.
- Migrating an external plugin into the monorepo (pair with the `plugin-transfer` skill).
- Investigating runtime cost, re-renders, or styling that does not respect the Studio theme.
- Deciding how a plugin should be structured to match the rest of the repo.

## How to Use

Read the reference file for the area you are working in. Each reference lists the anti-pattern, the
preferred approach, and `Incorrect` / `Correct` examples grounded in real plugins in this repo.

| Area            | What it covers                                                                               | Reference                                          |
| --------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Styling and CSS | Why raw `<style>` tags hurt performance; prefer static CSS, fall back to `styled-components` | [`references/styling.md`](./references/styling.md) |

> This skill is intended to grow. When you find a plugin pattern worth standardizing (or an
> anti-pattern worth banning), add a focused reference file and a row to the table above rather than
> bloating this entry point.

## Styling: the one-line rule

When a plugin needs styles, pick the cheapest option that works, in this order:

1. **Static CSS** — author or import plain CSS once at module scope. Parsed a single time, cached by
   the browser, deduplicated by the bundler, zero per-render cost. **Prefer this.**
2. **`styled-components`** — only when styles must be computed at runtime (depend on the
   `@sanity/ui` theme, props, or state). This is the Studio's styling solution and an existing peer
   dependency, so it shares one managed stylesheet and the Studio theme.
3. **Never** render raw `<style>` tags (in JSX, via `dangerouslySetInnerHTML`, or by appending a
   `<style>`/`<link>` to `document.head` from a component). They re-parse on every render, duplicate
   per instance, bypass the theme, and are an injection risk.

See [`references/styling.md`](./references/styling.md) for the full rationale and examples.

## General principles

- **Build on `@sanity/ui`.** Compose Studio primitives (`Box`, `Card`, `Flex`, `Stack`, `Text`,
  `Button`, …) and read design tokens from the theme (`({theme}) => theme.sanity...`,
  `theme.space[...]`, `theme.radius[...]`) instead of hardcoding colors, spacing, or fonts.
- **Style with the priority above:** static CSS first, `styled-components` for runtime-dynamic
  styling, never raw `<style>` tags.
- **Import `styled-components` named, not default:** `import {css, keyframes, styled} from 'styled-components'`.
- **Declare shared peers** so the plugin resolves to the workspace `@sanity/styled-components`
  override (a single styled-components instance — required for theming and SSR). See
  [`references/styling.md`](./references/styling.md#dependency-setup).
- **Use `lodash-es`, never `lodash`** (matches `AGENTS.md`).
- **Apply the React performance rules** from `vercel-react-best-practices` (don't define components
  inside components, batch DOM/CSS writes, hoist static JSX, etc.).
