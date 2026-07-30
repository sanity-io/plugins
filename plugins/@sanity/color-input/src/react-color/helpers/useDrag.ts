/**
 * Drag plumbing shared by the picker surfaces (Saturation/Hue/Alpha) and the
 * draggable `EditableInput` label.
 *
 * Attaches a native `mousedown` listener to the target element; each drag then
 * tracks `mousemove`/`mouseup` on a window until the pointer is released or the
 * component unmounts. The callbacks are Effect Events, so every event reads the
 * latest render's props — mirroring how the original react-color class methods
 * read `this.props` on each event.
 *
 * Note: this deliberately does not use a React 19 ref-callback with cleanup —
 * the React Compiler memoizes ref callbacks against their captured deps, so a
 * mid-drag prop update (every `mousemove` triggers `onChange`) would detach and
 * re-attach the ref, aborting the in-flight drag.
 */
import {useEffectEvent, useLayoutEffect, type RefObject} from 'react'

export interface UseDragOptions {
  /** Called on `mousedown`; return `false` to ignore the gesture. */
  onDragStart: (event: MouseEvent) => boolean
  /** Called for every `mousemove` while dragging. */
  onDrag: (event: MouseEvent) => void
  /** Window to track the drag on (e.g. the nearest render window in nested iframes). */
  getWindow?: () => Window
  /** Set when the target element renders conditionally, to re-attach when it appears. */
  enabled?: boolean
}

export function useDrag(targetRef: RefObject<HTMLElement | null>, options: UseDragOptions): void {
  const onDragStart = useEffectEvent(options.onDragStart)
  const onDrag = useEffectEvent(options.onDrag)
  const getWindow = useEffectEvent(options.getWindow ?? (() => window))
  const enabled = options.enabled ?? true

  // useLayoutEffect so the listener is attached before paint — with useEffect
  // there is a small post-mount window where a drag could start unnoticed.
  useLayoutEffect(() => {
    const target = enabled ? targetRef.current : null
    if (!target) {
      return () => {}
    }

    const controller = new AbortController()
    let dragController: AbortController | null = null

    target.addEventListener(
      'mousedown',
      (event) => {
        if (!onDragStart(event)) {
          return
        }
        dragController?.abort()
        dragController = new AbortController()
        const {signal} = dragController
        const targetWindow = getWindow()
        targetWindow.addEventListener('mousemove', (moveEvent) => onDrag(moveEvent), {signal})
        targetWindow.addEventListener('mouseup', () => dragController?.abort(), {signal})
      },
      {signal: controller.signal},
    )

    return () => {
      controller.abort()
      dragController?.abort()
    }
  }, [enabled, targetRef])
}
