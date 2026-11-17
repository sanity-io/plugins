interface Watch {
  element: Element
  callback: () => void
}

const watches = new Set<Watch>()
let observer: MutationObserver | null = null

function check() {
  for (const watch of watches) {
    if (!watch.element.isConnected) {
      watches.delete(watch)
      watch.callback()
    }
  }
  if (watches.size === 0) {
    observer?.disconnect()
    observer = null
  }
}

/**
 * Calls `callback` once `element` has been removed from the document. Returns a function that
 * stops watching. One shared `MutationObserver` serves every watch.
 */
export function onRemovedFromDocument(element: Element, callback: () => void): () => void {
  const watch = {element, callback}
  watches.add(watch)
  if (!observer) {
    observer = new MutationObserver(check)
    observer.observe(element.ownerDocument, {childList: true, subtree: true})
  }
  return () => {
    watches.delete(watch)
    if (watches.size === 0) {
      observer?.disconnect()
      observer = null
    }
  }
}

const noop = () => {
  //
}

/**
 * For the cleanup of an effect whose resource should outlive an `<Activity>` hide.
 *
 * The Studio keeps recently used tools mounted behind an `<Activity>` boundary. React cleans up
 * their effects when it hides a tool, and does not run those cleanups again if it unmounts the
 * hidden tool later. A cleanup that finds `element` still in the document is therefore a hide:
 * `onHide` runs now and `dispose` once the element leaves the document. Otherwise it is an
 * unmount, and `dispose` runs now. Returns a function that stops waiting, for the effect to call
 * when it runs again on reveal.
 */
export function disposeOnUnmount(
  element: Element | null,
  dispose: () => void,
  onHide?: () => void,
): () => void {
  if (element?.isConnected) {
    onHide?.()
    return onRemovedFromDocument(element, dispose)
  }
  dispose()
  return noop
}
