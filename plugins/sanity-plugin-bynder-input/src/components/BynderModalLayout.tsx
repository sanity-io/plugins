import {
  type CompactViewProps,
  type PortalConfig,
  type AdditionalInfo,
  Modal,
  Login,
  CompactView,
} from '@bynder/compact-view'

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Login portal={portalConfig}>
        <CompactView {...compactViewOptions} onSuccess={onSuccess} mode="SingleSelectFile" />
      </Login>
    </Modal>
  )
}
