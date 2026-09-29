import {createContext, useContext} from 'react'
import type {ActorRefFrom} from 'xstate'
import {createEmptyActor} from 'xstate'

import type {BuildThemeOptions} from '../theme/options'
import type {ThemerEvent, themerMachine} from './machine'
import type {ToolReducerAction, ToolReducerState} from './reducer'
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
/**
 * The themer machine's actor, for everything in the sidebar to select from
 * and send to. We don't do null checks on this one because we ensure it is
 * always provided in other ways
 * @internal
 */
export const ToolActorRefContext = createContext<ActorRefFrom<typeof themerMachine>>(
  // oxlint-disable-next-line no-unsafe-type-assertion -- a stand-in until the layout provides the actor
  createEmptyActor() as unknown as ActorRefFrom<typeof themerMachine>,
)
/** @internal */
export const ToolSplitIsOpenContext = createContext<boolean>(false)

/** The `themerTool` options, resolved with their defaults @internal */
export interface PluginConfig {
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

/** @deprecated prop drill instead pls */
export type ThemerView =
  | {name: 'list'}
  | {
      name: 'edit'
      slug: string
      /** Whether the title input should take focus, for themes that were just created */
      focusTitle: boolean
    }
  | {name: 'removed'}

/** @deprecated prop drill instead pls */
export interface ThemerContextValue {
  /** @deprecated prop drill instead pls */
  baseOptions: BuildThemeOptions
  /** @deprecated prop drill instead pls */
  themes: ThemerTheme[]
  /** @deprecated prop drill instead pls */
  removed: ThemerTheme[]
  /** @deprecated prop drill instead pls */
  active: ThemerTheme
  /** @deprecated prop drill instead pls */
  images: Record<string, string>
  /** @deprecated prop drill instead pls */
  view: ThemerView
  /** @deprecated prop drill instead pls */
  send: (event: ThemerEvent) => void
}

/** @deprecated prop drill instead pls */
export const ThemerContext = createContext<ThemerContextValue | null>(null)

/**
 * The state machine send() method that for when the tool is open (the machine is paused when closed)
 * @internal
 * @deprecated use ToolActorRefContext instead
 */
export const ToolSendContext = createContext<(event: ThemerEvent) => void>(() => {
  throw new Error('ToolSendContext not initialized')
})

/**
 * Prop-drilled props
 * @internal
 */
export interface ThemerProps extends ToolReducerState {
  actorRef: ActorRefFrom<typeof themerMachine>
  dispatch: React.Dispatch<ToolReducerAction>
  themes: ThemerTheme[]
  removed: ThemerTheme[]
  active: ThemerTheme
  images: Record<string, string>
  navbarHeight: number | null
  /** @deprecated we do not support mobile layouts yet */
  mobile: boolean
  view:
    | {name: 'list'}
    | {
        name: 'edit'
        slug: string
        /** Whether the title input should take focus, for themes that were just created */
        focusTitle: boolean
      }
    | {name: 'removed'}
  /** @deprecated use actorRef.send() instead */
  send: (event: ThemerEvent) => void
}
