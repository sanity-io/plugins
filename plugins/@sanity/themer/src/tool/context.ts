import {createContext, useContext} from 'react'
import type {ActorRefFrom} from 'xstate'

import type {BuildThemeOptions} from '../theme/options'
import type {themerMachine} from './machine'
import type {ToolReducerAction, ToolReducerState} from './reducer'
import type {ThemerView} from './selectors'
import type {ThemerTheme} from './themes'

/*
 * The tool reducer's state that the navbar toggle shows and changes. The
 * Studio renders the navbar itself, out of the layout's reach, so this is
 * where the reducer's values travel by context — the layout and the sidebar
 * get them as props. One context per value, on purpose: a consumer only
 * re-renders for the value it reads, where one object would re-render every
 * consumer for any change.
 */

/** @internal */
export const ToolIsOpenContext = createContext<boolean>(false)
/**
 * The global top-level useReducer dispatch() for state that persists through open/close of the tool
 * @internal */
export const ToolDispatchContext = createContext<React.Dispatch<ToolReducerAction>>(() => {
  throw new Error('ToolDispatchContext not initialized')
})
/** @internal */
export const ToolSplitIsOpenContext = createContext<boolean>(false)

/** The `themerTool` options, resolved with their defaults @internal */
export interface PluginConfig {
  /** The theme options the Studio's configured theme was generated from */
  baseOptions: BuildThemeOptions
  /** What the tool goes by in the navbar toggle's label and tooltip */
  title: string
}

/** @internal */
export const PluginConfigContext = createContext<PluginConfig | null>(null)

/** @internal */
export function usePluginConfig(): PluginConfig {
  const config = useContext(PluginConfigContext)

  if (!config) {
    throw new Error('usePluginConfig must be used within the `themerTool` plugin')
  }

  return config
}

/**
 * What the layout hands down to the sidebar and its flows, each component
 * picking what it needs (`Pick<ThemerProps, ...>`): the tool reducer's
 * state, the machine's actor to select from and send to, and what the
 * layout has selected from it already — the themes, which flow the sidebar
 * is in, the images of this session and the Studio navbar's height.
 *
 * @internal
 */
export interface ThemerProps extends ToolReducerState {
  actorRef: ActorRefFrom<typeof themerMachine>
  dispatch: React.Dispatch<ToolReducerAction>
  /** The themes to pick from, in list order */
  themes: ThemerTheme[]
  /** The removed themes, which can be restored */
  removed: ThemerTheme[]
  /** The applied theme */
  active: ThemerTheme
  /** Object URLs of the images themes took their palette from this session, by slug */
  images: Record<string, string>
  /** The height of the Studio navbar, which the sidebar's header matches — `null` until it has rendered */
  navbarHeight: number | null
  view: ThemerView
}
