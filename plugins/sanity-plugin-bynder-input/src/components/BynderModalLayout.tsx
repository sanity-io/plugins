import {
  type CompactViewProps,
  type PortalConfig,
  type AdditionalInfo,
  Modal,
  Login,
  CompactView,
} from '@bynder/compact-view'
import {useEffect} from 'react'

/**
 * `@bynder/compact-view` attaches an open shadow root to its host element in a passive effect
 * that has no cleanup and doesn't reuse an existing root. Whenever React re-runs passive effects
 * on the same host — `reconnectPassiveEffects`, e.g. from `<StrictMode>` or a Studio pane
 * hidden and shown with `<Activity>` — the second `attachShadow()` throws and Compact View
 * silently falls back to rendering into the host's light DOM, which the already-attached shadow
 * tree (containing only style tags, no slot) hides: the modal appears to never open. Appending a
 * `<slot>` to the shadow root makes that light DOM fallback render, and renders nothing when
 * Compact View portals into the shadow root normally, so it's safe in both cases.
 */
function useCompactViewShadowRootSlotFallback() {
  useEffect(() => {
    // The container, host and shadow root are (re)created across effects and portal re-renders,
    // so there's no single point in time to patch the shadow root — keep it slotted with a cheap
    // per-frame check for as long as the modal is mounted (it unmounts when closed).
    let frame = 0
    const ensureSlot = () => {
      const host = document.querySelector(
        '[data-test-id="CompactViewContainer"] [data-testid="root"]',
      )
      const shadowRoot = host?.shadowRoot
      if (shadowRoot && !shadowRoot.querySelector('slot')) {
        shadowRoot.append(document.createElement('slot'))
      }
      frame = requestAnimationFrame(ensureSlot)
    }
    frame = requestAnimationFrame(ensureSlot)
    return () => cancelAnimationFrame(frame)
  }, [])
}

export default function BynderModalLayout({
  isOpen,
  onClose,
  portalConfig,
  compactViewOptions,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  portalConfig: PortalConfig
  compactViewOptions: CompactViewProps
  onSuccess: (assets: unknown[], addInfo: AdditionalInfo) => void
}): React.JSX.Element {
  useCompactViewShadowRootSlotFallback()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Login portal={portalConfig}>
        <CompactView {...compactViewOptions} onSuccess={onSuccess} mode="SingleSelectFile" />
      </Login>
    </Modal>
  )
}
