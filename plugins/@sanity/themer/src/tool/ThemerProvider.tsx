import {ThemeProvider, useMediaIndex} from '@sanity/ui'
import {use, useReducer, useState} from 'react'
import {browser} from 'react-dom'
import {useColorSchemeValue} from 'sanity'

import {MIN_MEDIA_INDEX_FOR_SIDEBAR, MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN} from '#constants'
import type {ThemerProps} from '#types'

import {buildTheme} from '../theme/buildTheme'
import {initialToolState, toolReducer} from './reducer'
import {resolveActiveThemeOptions} from './selectors'
import {readPersistedSnapshot} from './storage'
import {ThemerLayout} from './ThemerLayout'

/**
 * Keep this component extremely lightweight, and only include state that are needed by both
 *  `studio.components.layout` and `studio.components.navbar`, where it's not possible to prop-drill into `studio.components.navbar`,
 * and that need to survive open/close of the tool
 * @TODO will mount on the future `studio.components.provider` entrypoint to ensure other plugins using `studio.components.layout` is correctly wrapped in the top-level theme regardless of plugin ordering
 */
export function ThemerProvider({
  children,
  config,
}: {
  children: React.ReactNode
} & Pick<ThemerProps, 'config'>) {
  use(browser('The current theme is stored in localStorage.'))

  const [persistedSnapshot] = useState(readPersistedSnapshot)
  const [state, dispatch] = useReducer(toolReducer, initialToolState, (initialState) => {
    if (!persistedSnapshot) return initialState
    const theme = resolveActiveThemeOptions(persistedSnapshot.context)
    return theme ? {...initialState, theme} : initialState
  })

  const scheme = useColorSchemeValue()
  const index = useMediaIndex()
  const isMobile = index <= MIN_MEDIA_INDEX_FOR_SIDEBAR
  const isTooSmallForSplitScreen = index <= MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN

  // @TODO Themer does not yet support mobile
  const open = state.open && !isMobile
  // Split screen needs some space
  const split = state.split && !isTooSmallForSplitScreen

  return (
    <ThemeProvider theme={(state.theme !== null ? buildTheme(state.theme) : null) ?? undefined}>
      <ThemerLayout
        config={config}
        backgroundColor={state.theme?.[scheme]?.background}
        dispatch={dispatch}
        navbarHeight={state.navbarHeight}
        open={open}
        persistedSnapshot={persistedSnapshot}
        prerender={state.prerender}
        prerenderSplitScreen={state.prerenderSplitScreen}
        scheme={scheme}
        split={split}
      >
        {children}
      </ThemerLayout>
    </ThemeProvider>
  )
}
