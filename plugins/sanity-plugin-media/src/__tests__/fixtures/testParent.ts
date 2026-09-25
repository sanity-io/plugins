import {createActor, type EventObject, fromCallback, type SimulatedClock} from 'xstate'

/**
 * Child machines report to their parent with `sendParent`, which throws without one. Create the
 * child with `{parent}` from here to run it standalone and assert on what it reported. A child
 * joins its parent's actor system, so pass the `clock` here to control delayed transitions.
 */
export function createTestParent<TEvent extends EventObject = EventObject>(
  options: {clock?: SimulatedClock} = {},
) {
  const events: TEvent[] = []
  const parent = createActor(
    fromCallback<TEvent>(({receive}) => {
      receive((event) => {
        events.push(event)
      })
    }),
    options,
  )
  parent.start()

  return {
    events,
    parent,
    /** Reported events of the given type, in order. */
    reported: <TType extends TEvent['type']>(type: TType) =>
      events.filter((event): event is Extract<TEvent, {type: TType}> => event.type === type),
  }
}
