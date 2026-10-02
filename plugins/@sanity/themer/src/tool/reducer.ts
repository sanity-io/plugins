import {dequal} from 'dequal/lite'

import type {BuildThemeOptions} from '../theme/options'
import {resolveActiveThemeOptions} from './selectors'
import type {ThemerState} from './themes'

/**
 * What the layout shows, owned by the `useReducer` in `plugin.tsx`, handed
 * down to the layout and the sidebar as props and to the navbar toggle
 * through the `Tool*Context`s: whether the sidebar is open and whether the Studio
 * shows twice, whether either has been prerendered yet — they mount ahead of
 * their first showing, so that the code loads and the tree is warm before the
 * transition — the options of the applied theme, as the machine publishes
 * them, and the height of the Studio navbar, as the navbar toggle measures
 * it, for the sidebar's header to match.
 */
export type ToolReducerState = {
  navbarHeight: number | null
  open: boolean
  prerender: boolean
  prerenderSplitScreen: boolean
  split: boolean
  theme: BuildThemeOptions | null
}

export type ToolReducerAction =
  | {type: 'set-navbar-height'; height: number}
  | {type: 'prerender'}
  | {type: 'open'}
  | {type: 'close'}
  | {type: 'split-screen:prerender'}
  | {type: 'split-screen:open'}
  | {type: 'split-screen:close'}
  | {type: 'set-theme'; theme: BuildThemeOptions}
  | {type: 'unset-theme'}

/**
 * Where the tool starts: closed, nothing prerendered, and the theme the last
 * session left applied — so the first paint already has it, before the
 * machine has published anything (see `ThemerThemeCrossfader`). The
 * configured theme, or a stored theme that no longer resolves, applies
 * nothing.
 */
export function initialToolState(persisted: ThemerState): ToolReducerState {
  return {
    navbarHeight: null,
    prerender: false,
    prerenderSplitScreen: false,
    open: false,
    split: false,
    theme: resolveActiveThemeOptions(persisted),
  }
}

export function toolReducer(state: ToolReducerState, action: ToolReducerAction): ToolReducerState {
  switch (action.type) {
    case 'set-navbar-height':
      return state.navbarHeight === action.height ? state : {...state, navbarHeight: action.height}
    case 'prerender':
      return state.prerender ? state : {...state, prerender: true}
    case 'open':
      return state.open ? state : {...state, open: true, prerender: true}
    case 'close':
      return state.open ? {...state, open: false} : state
    case 'split-screen:prerender':
      return state.prerenderSplitScreen ? state : {...state, prerenderSplitScreen: true}
    case 'split-screen:open':
      return state.split ? state : {...state, prerenderSplitScreen: true, split: true}
    case 'split-screen:close':
      return state.split ? {...state, split: false} : state
    case 'unset-theme':
      return state.theme === null ? state : {...state, theme: null}
    case 'set-theme':
      return dequal(state.theme, action.theme) ? state : {...state, theme: action.theme}
    default: {
      // Every action is handled above, so only a dispatch the types do not
      // know about gets here — a bug worth hearing of, not a silent no-op
      const unknown: never = action
      throw new Error(`Unknown themer tool action: ${JSON.stringify(unknown)}`)
    }
  }
}
