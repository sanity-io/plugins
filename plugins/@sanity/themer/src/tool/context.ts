import {createContext, useContext} from 'react'

import type {PluginConfig} from '#types'

import type {ToolReducerAction} from './reducer'

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
/**
 * Whether the navbar toggle is the one to measure the Studio navbar's height
 * for the sidebar's header — the Studio renders the navbar in the split copy
 * too, which must stay quiet
 * @internal
 */
export const ToolShouldDetectNavbarHeightContext = createContext<boolean>(false)

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
