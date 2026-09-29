import type {ActorRefFrom} from 'xstate'
import type {ThemerEvent, themerMachine} from './machine'
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
  config: Required<PluginConfig>
  dispatch: React.Dispatch<ToolReducerAction>
  themes: ThemerTheme[]
  removed: ThemerTheme[]
  active: ThemerTheme
  images: Record<string, string>
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

