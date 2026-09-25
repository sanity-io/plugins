import {type ActorRefFrom, enqueueActions, setup, type SnapshotFrom} from 'xstate'

import type {Dialog} from '../types'

export type DialogsEvent =
  | {type: 'dialog.open'; dialog: Dialog}
  | {type: 'dialog.close'; id: string}
  | {type: 'dialogs.clear'}

export type DialogsReport =
  | {type: 'dialog.opened'; dialog: Dialog}
  | {type: 'dialog.closed'; dialog: Dialog}
  | {type: 'dialogs.emptied'}

/**
 * The stack of open dialogs, rendered nested in order. Opening and closing dialogs is reported to
 * the parent, as some dialogs affect the rest of the browser while they are open.
 */
export const dialogsMachine = setup({
  types: {} as {
    context: {items: Dialog[]}
    events: DialogsEvent
  },
  guards: {
    'is open': ({context}, params: {id: string}) =>
      context.items.some((item) => item.id === params.id),
    'has dialogs': ({context}) => context.items.length > 0,
  },
  actions: {
    'set dialogs': enqueueActions(({context, enqueue}, params: {items: Dialog[]}) => {
      const closed = context.items.filter((dialog) => !params.items.includes(dialog))
      const opened = params.items.filter((dialog) => !context.items.includes(dialog))
      enqueue.assign({items: params.items})
      for (const dialog of closed) {
        enqueue.sendParent({type: 'dialog.closed', dialog} satisfies DialogsReport)
      }
      for (const dialog of opened) {
        enqueue.sendParent({type: 'dialog.opened', dialog} satisfies DialogsReport)
      }
      if (params.items.length === 0) {
        enqueue.sendParent({type: 'dialogs.emptied'} satisfies DialogsReport)
      }
    }),
  },
}).createMachine({
  id: 'dialogs',
  context: {items: []},
  on: {
    'dialog.open': {
      guard: ({context, event}) => !context.items.some((item) => item.id === event.dialog.id),
      actions: {
        type: 'set dialogs',
        params: ({context, event}) => ({items: [...context.items, event.dialog]}),
      },
    },
    'dialog.close': {
      guard: {type: 'is open', params: ({event}) => ({id: event.id})},
      actions: {
        type: 'set dialogs',
        params: ({context, event}) => ({
          items: context.items.filter((item) => item.id !== event.id),
        }),
      },
    },
    'dialogs.clear': {
      guard: 'has dialogs',
      actions: {type: 'set dialogs', params: {items: []}},
    },
  },
})

export type DialogsActorRef = ActorRefFrom<typeof dialogsMachine>
export type DialogsSnapshot = SnapshotFrom<typeof dialogsMachine>
