import {definePlugin, type LayoutProps} from 'sanity'

import type {PluginConfig} from '#types'

import {ThemerNavbar} from './ThemerNavbar'
import {ThemerProvider} from './ThemerProvider'

/**
 * Options for the {@link themerTool} plugin.
 *
 * This is experimental and may change or be removed in any release without
 * notice — use at your own risk.
 *
 * @alpha
 */
export interface ThemerToolOptions {
  /**
   * What the tool goes by in the Studio navbar — the toggle's label and
   * tooltip. Defaults to `Themer`.
   */
  title?: string
}

/**
 * A Studio plugin that adds a themer sidebar for `buildTheme` themes: a
 * navbar toggle opens the sidebar next to the Studio, with a list of themes —
 * the configured theme, the presets and your own — each previewed as a tiny
 * Studio in both color schemes. Picking one applies it live to the whole
 * Studio while you browse around; your own themes can be edited with
 * accent/text/background pickers and a contrast slider per scheme, added,
 * duplicated, given the colors of an image (its palette is read on device),
 * removed and restored, and a dialog shows the `buildTheme` snippet that
 * makes the applied theme permanent. Toggle between light and dark mode with
 * the regular appearance menu — the preview follows it — or split the
 * preview to see the whole Studio in light and dark side by side.
 *
 * ```ts
 * import {themerTool} from '@sanity/themer/tool'
 * import {defineConfig} from 'sanity'
 *
 * export default defineConfig({
 *   plugins: [themerTool()],
 *   // ...rest of the config
 * })
 * ```
 *
 * This is experimental and may change or be removed in any release without
 * notice — use at your own risk.
 *
 * @alpha
 */
export const themerTool = definePlugin<ThemerToolOptions | void>((options) => {
  const {title = 'Themer'} = options ?? {}
  const ThemerLayoutProvider = defineThemerLayout({title})

  return {
    name: '@sanity/themer/tool',
    studio: {
      components: {layout: ThemerLayoutProvider, navbar: ThemerNavbar},
    },
  }
})

// This wrapper creates a clean closure that allows safely using the `'use memo'` directive
// so that the dynamically created component can be memoized by react compiler
function defineThemerLayout(config: PluginConfig) {
  return function DefinedThemerLayoutProvider(props: LayoutProps) {
    'use memo'

    return <ThemerProvider config={config}>{props.renderDefault(props)}</ThemerProvider>
  }
}
