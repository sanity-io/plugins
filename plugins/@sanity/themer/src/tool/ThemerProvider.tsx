import {useActor} from '@sanity-labs/xstate-react'
import {ThemeProvider, useMediaIndex} from '@sanity/ui'
import {startTransition, use, useLayoutEffect, useReducer, useRef, useState} from 'react'
import {browser} from 'react-dom'
import {useColorSchemeValue} from 'sanity'
import {createActor} from 'xstate'
import {restoreActor} from 'xstate/persist'

import {MIN_MEDIA_INDEX_FOR_SIDEBAR, MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN} from '#constants'
import type {ThemerProps} from '#types'

import {buildTheme} from '../theme/buildTheme'
import type {BuildThemeOptions} from '../theme/options'
import {addThemerTransitionType} from './addThemerTransitionType'
import {switchesTheme, type ThemerEvent, themerMachine} from './machine'
import {initialToolState, toolReducer} from './reducer'
import {resolveActiveThemeOptions} from './selectors'
import {readPersistedSnapshot} from './storage'
import {ThemerLayout} from './ThemerLayout'

/** The themer machine, picking up where the last session left off when it can */
function createThemerActor() {
  const persisted = readPersistedSnapshot()

  return persisted ? restoreActor(themerMachine, persisted) : createActor(themerMachine)
}

/**
 * Keep this component extremely lightweight, and only include state that are needed by both
 *  `studio.components.layout` and `studio.components.navbar`, where it's not possible to prop-drill into `studio.components.navbar`,
 * and that need to survive open/close of the tool
 * @TODO will mount on the future `studio.components.provider` entrypoint to ensure other plugins using `studio.components.layout` is correctly wrapped in the top-level theme regardless of plugin ordering
 *
 * The themer machine runs here, as the applied theme is the machine's: every
 * event goes to it in a transition, and one that switches themes is tagged to
 * cross-fade the Studio over to the new one, while edits to the applied
 * theme's colors apply live.
 */
export function ThemerProvider({
  children,
  config,
}: {
  children: React.ReactNode
} & Pick<ThemerProps, 'config'>) {
  use(browser('The current theme is stored in localStorage.'))

  const [actor] = useState(createThemerActor)
  const [snapshot, sendToMachine] = useActor(actor)
  const [state, dispatch] = useReducer(toolReducer, initialToolState)

  // What an event is previewed on to tell a switch, kept out of `send` so that
  // what it is handed to does not re-render with every snapshot
  const committedSnapshot = useRef(snapshot)
  useLayoutEffect(() => {
    committedSnapshot.current = snapshot
  })
  const send = (event: ThemerEvent) =>
    startTransition(() => {
      if (switchesTheme(committedSnapshot.current, event)) addThemerTransitionType('crossfade')
      sendToMachine(event)
    })

  const scheme = useColorSchemeValue()
  const index = useMediaIndex()
  const isMobile = index <= MIN_MEDIA_INDEX_FOR_SIDEBAR
  const isTooSmallForSplitScreen = index <= MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN

  // @TODO Themer does not yet support mobile
  const open = state.open && !isMobile
  // Split screen needs some space
  const split = state.split && !isTooSmallForSplitScreen
  const theme = resolveActiveThemeOptions(snapshot.context)

  return (
    <ThemerThemeProvider options={theme}>
      <ThemerLayout
        config={config}
        backgroundColor={theme?.[scheme]?.background}
        dispatch={dispatch}
        navbarHeight={state.navbarHeight}
        open={open}
        prerender={state.prerender}
        prerenderSplitScreen={state.prerenderSplitScreen}
        scheme={scheme}
        send={send}
        snapshot={snapshot}
        split={split}
      >
        {children}
      </ThemerLayout>
    </ThemerThemeProvider>
  )
}

/**
 * Builds the Studio theme from the applied theme's options alone, as a
 * snapshot that leaves them as they were must not rebuild it: a new theme
 * re-renders the whole Studio
 */
function ThemerThemeProvider({
  children,
  options,
}: {
  children: React.ReactNode
  options: BuildThemeOptions | null
}) {
  return (
    <ThemeProvider theme={(options !== null ? buildTheme(options) : null) ?? undefined}>
      {children}
    </ThemeProvider>
  )
}
