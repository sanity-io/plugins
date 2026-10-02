import type {ActorRefFrom} from 'xstate'

import type {BuildThemeOptions} from '../theme/options'
import type {themerMachine} from './machine'
import type {ToolReducerAction, ToolReducerState} from './reducer'
import type {ThemerView} from './selectors'
import type {ThemerTheme} from './themes'

/** The `themerTool` options, resolved with their defaults @internal */
export interface PluginConfig {
  /** The theme options the Studio's configured theme was generated from */
  baseOptions: BuildThemeOptions
  /** What the tool goes by in the navbar toggle's label and tooltip */
  title: string
}

/**
 * What the layout hands down to the sidebar and its flows, each component
 * picking what it needs (`Pick<ThemerProps, ...>`): the tool reducer's
 * state, the machine's actor to select from and send to, the resolved
 * options, and what the layout has selected from the machine already — the
 * themes, which flow the sidebar is in and the images of this session.
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
  /** The applied theme */
  active: ThemerTheme
  /** Object URLs of the images themes took their palette from this session, by slug */
  images: Record<string, string>
  view: ThemerView
}
