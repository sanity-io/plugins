import {ThemeProvider} from '@sanity/ui'
import {use, useReducer, useState} from 'react'
import {browser} from 'react-dom'
import {definePlugin, type LayoutProps} from 'sanity'

import type {PluginConfig} from '#types'

import {buildTheme} from '../theme/buildTheme'
import type {BuildThemeOptions} from '../theme/options'
import {initialToolState, toolReducer} from './reducer'
import {readPersistedThemer} from './storage'
import {ThemerLayout} from './ThemerLayout'
import {ThemerNavbar} from './ThemerNavbar'
import {useIsMobile} from './useIsMobile'
import {useIsTooSmallForSplitScreen} from './useIsTooSmallForSplitScreen'

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
   * The `buildTheme` options that the Studio's configured theme was generated
   * from — the themer starts editing from these, so pass the same object that
   * the `theme` in the Studio config uses:
   *
   * ```ts
   * const config: BuildThemeOptions = {light: {accent: '#1cb485'}, dark: {accent: '#22fca8'}}
   *
   * export default defineConfig({
   *   theme: buildTheme(config),
   *   plugins: [themerTool({config})],
   * })
   * ```
   */
  config?: BuildThemeOptions
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
  // No options generate the stock theme, which is what a Studio without a
  // `theme` in its config gets
  const {config: baseOptions = {}, title = 'Themer'} = options ?? {}
  const ThemerLayoutProvider = defineThemerLayout({baseOptions, title})

  return {
    name: '@sanity/themer/tool',
    studio: {
      components: {layout: ThemerLayoutProvider, navbar: ThemerNavbar},
    },
  }
})

function defineThemerLayout(config: PluginConfig) {
  return function DefinedThemerLayoutProvider(props: LayoutProps) {
    'use memo'

    return <ThemerProvider config={config}>{props.renderDefault(props)}</ThemerProvider>
  }
}

/**
 * Keep this component extremely lightweight, and only include state that are needed by both
 *  `studio.components.layout` and `studio.components.navbar`, where it's not possible to prop-drill into `studio.components.navbar`,
 * and that need to survive open/close of the tool
 * @TODO will mount on the future `studio.components.provider`  entrypoint
 */
function ThemerProvider({children, config}: {children: React.ReactNode; config: PluginConfig}) {
  use(browser('The current theme is stored in localStorage.'))

  const [persisted] = useState(() => readPersistedThemer(config.baseOptions))
  const [state, dispatch] = useReducer(toolReducer, persisted.state, initialToolState)
  const isMobile = useIsMobile()
  const isTooSmallForSplitScreen = useIsTooSmallForSplitScreen()
  // @TODO Themer does not yet support mobile
  const open = state.open && !isMobile
  // Split screen needs some space
  const split = state.split && !isTooSmallForSplitScreen

  return (
    <ThemeProvider theme={(state.theme !== null ? buildTheme(state.theme) : null) ?? undefined}>
      <ThemerLayout
        config={config}
        dispatch={dispatch}
        navbarHeight={state.navbarHeight}
        open={open}
        persisted={persisted}
        prerender={state.prerender}
        prerenderSplitScreen={state.prerenderSplitScreen}
        split={split}
      >
        {children}
      </ThemerLayout>
    </ThemeProvider>
  )
}
