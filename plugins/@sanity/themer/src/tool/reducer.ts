import {dequal} from 'dequal/lite'

import type {BuildThemeOptions} from '../theme/options'

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
export const initialToolState = {
  navbarHeight: null,
  open: false,
  prerender: false,
  prerenderSplitScreen: false,
  split: false,
  theme: null,
} as const satisfies ToolReducerState
