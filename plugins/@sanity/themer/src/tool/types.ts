import type {ActorRefFrom} from 'xstate'

import type {themerMachine} from './machine'
import type {ToolReducerAction, ToolReducerState} from './reducer'
import type {ThemerTheme} from './themes'

/** The `themerTool` options, resolved with their defaults @internal */
export interface PluginConfig {
  /** What the tool goes by in the navbar toggle's label and tooltip */
  title: string
}

/**
 * Prop-drilled props
 * @internal
 */
export interface ThemerProps extends ToolReducerState {
  actorRef: ActorRefFrom<typeof themerMachine>
  config: PluginConfig
  dispatch: React.Dispatch<ToolReducerAction>
  themes: ThemerTheme[]
  removed: ThemerTheme[]
  active: ThemerTheme | undefined
}
