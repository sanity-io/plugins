# Sanity Plugins Storybook

A React [Storybook](https://storybook.js.org) for the plugins in this monorepo, set up like the [Sanity UI Storybook](https://github.com/sanity-io/ui/tree/main/apps/storybook).

```sh
pnpm dev:storybook   # http://localhost:6006
pnpm test:browser    # every story as a browser test
pnpm storybook:build # static build in apps/storybook/storybook-static
```

## Storybook guidelines

- Stories live in `stories/<plugin>/`, e.g. `stories/themer/` for `@sanity/themer`.
- All stories must export either a named `Default` or `Basic` story.
- Avoid creating custom titles for stories - these should be inferred via folder structure alone.
- Where possible, stories should be kept as simple as possible with minimal custom / presentational props.
- Prefer setting component values via storybook [args](https://storybook.js.org/docs/react/writing-stories/args) instead of passing them manually in props.
- Stories import a plugin through its package name. Components that are not part of a plugin's public API (like the pieces of the `@sanity/themer` tool) are imported from the plugin's `src/` by relative path instead.

## Things to note

- All stories are wrapped with a [common decorator](https://storybook.js.org/docs/react/writing-stories/decorators#story-decorators) which wraps stories in both a `<ThemeProvider>` but also a `<Card>` with padding. The theme is built by `buildTheme` from `@sanity/themer`, from the preset picked in the toolbar next to the light/dark scheme toggle. Stories that depend on exact viewport dimensions can opt out of the padding with the `padding: 0` parameter.
- Interaction tests are written as story `play` functions and run in a real browser with the [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) (`pnpm test:browser`). Stories opt out of being tested with the `!test` tag. The Playwright-provided browser must be installed once via `pnpm --filter plugins-storybook exec playwright install chromium`.
