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
 * What is handed down from the layout to the sidebar and on to its flows,
 * each component picking what it needs (`Pick<ThemerProps, ...>`): the tool
 * reducer's state, the machine's actor to select from and send to, the
 * plugin's options, and the themes the sidebar resolves from the machine —
 * listed, removed and applied.
 *
 * @internal
 */
export interface ThemerProps extends ToolReducerState {
  actorRef: ActorRefFrom<typeof themerMachine>
  config: PluginConfig
  dispatch: React.Dispatch<ToolReducerAction>
  /** The themes to pick from, in list order */
  themes: ThemerTheme[]
  /** The removed themes, which can be restored */
  removed: ThemerTheme[]
  /** The applied theme — `undefined` when the Studio's configured theme applies, or the applied one no longer resolves */
  active: ThemerTheme | undefined
}
