import {type ActorRefFrom, type AnyActorRef, assign, setup} from 'xstate'

import {createHttpError, delay} from './utils'

export type DebugEvent =
  | {type: 'debug.toggle'}
  | {type: 'debug.badConnection.set'; badConnection: boolean}

export const debugMachine = setup({
  types: {} as {
    context: {badConnection: boolean; enabled: boolean}
    events: DebugEvent
  },
}).createMachine({
  id: 'debug',
  context: {badConnection: false, enabled: false},
  on: {
    'debug.toggle': {
      actions: assign({enabled: ({context}) => !context.enabled}),
    },
    'debug.badConnection.set': {
      actions: assign({badConnection: ({event}) => event.badConnection}),
    },
  },
})

export type DebugActorRef = ActorRefFrom<typeof debugMachine>

/**
 * Runs `request`, but while the "bad connection" debug toggle is on, delays it by 3s and fails
 * half of the time instead. The `debug` actor is looked up through the system so actors running
 * without one are unaffected, and otherwise the request starts right away.
 */
export function withBadConnection<T>(
  system: AnyActorRef['system'],
  signal: AbortSignal | undefined,
  request: () => Promise<T>,
): Promise<T> {
  const debug: DebugActorRef | undefined = system.get('debug')
  if (!debug?.getSnapshot().context.badConnection) {
    return request()
  }
  return delay(3000, signal).then(() => {
    if (Math.random() > 0.5) {
      throw createHttpError('Test error', 500)
    }
    return request()
  })
}
