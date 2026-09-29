import {dequal} from 'dequal/lite'

import type {BuildThemeOptions} from '../theme/options'

export type ToolReducerState = {
  prerender: boolean
  prerenderSplitScreen: boolean
  open: boolean
  split: boolean
  theme: BuildThemeOptions | null
}
export type ToolReducerAction =
  | {type: 'prerender'}
  | {type: 'open'}
  | {type: 'toggle'}
  | {type: 'close'}
  | {type: 'prerender-split-screen'}
  | {type: 'split-screen'}
  | {type: 'split-screen:open'}
  | {type: 'split-screen:close'}
  | {type: 'split-screen:toggle'}
  | {type: 'split-screen:prerender'}
  | {type: 'set-theme'; theme: BuildThemeOptions}
  | {type: 'unset-theme'}
export function toolReducer(state: ToolReducerState, action: ToolReducerAction): ToolReducerState {
  switch (action.type) {
    case 'prerender':
      return state.prerender ? state : {...state, prerender: true}
    case 'open':
      return state.open ? state : {...state, open: true, prerender: true}
    case 'toggle':
      return {...state, open: !state.open, prerender: true}
    case 'close':
      return state.open ? {...state, open: false} : state
    case 'split-screen:prerender':
    case 'prerender-split-screen':
      return state.prerenderSplitScreen ? state : {...state, prerenderSplitScreen: true}
    case 'split-screen:toggle':
    case 'split-screen':
      return {...state, prerenderSplitScreen: true, split: !state.split}
    case 'split-screen:open':
      return state.split ? state : {...state, prerenderSplitScreen: true, split: true}
    case 'split-screen:close':
      return state.split ? {...state, split: false} : state
    case 'unset-theme':
      return state.theme === null ? state : {...state, theme: null}
    case 'set-theme':
      return dequal(state.theme, action.theme) ? state : {...state, theme: action.theme}
    // @TODO throw on unknown action
    default:
      return state
  }
}
