import {PortalProvider} from '@sanity/ui'
import {type AssetSourceComponentProps, type SanityDocument, useFormValue} from 'sanity'

import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import {MediaActorsProvider} from '../../contexts/MediaActorsContext'
import useRootPortalElement from '../../hooks/useRootPortalElement'
import useVersionedClient from '../../hooks/useVersionedClient'
import GlobalStyle from '../../styled/GlobalStyles'
import {isSupportedAssetType} from '../../utils/isSupportedAssetType'
import Dialogs from '../Dialogs'

/**
 * Opens the edit dialog of the already selected asset. The media actor closes the asset source
 * once that dialog (and any nested dialog, e.g. the delete confirmation) is dismissed, or right
 * away when there is nothing to edit, so the source can be opened again.
 */
const EditAssetTool = (props: AssetSourceComponentProps) => {
  const {onClose, selectedAssets} = props

  const portalElement = useRootPortalElement()

  // `useFormValue` can return null/undefined (e.g. on a pristine/unsaved draft).
  const currentDocument = useFormValue([]) as SanityDocument | null | undefined

  const client = useVersionedClient()

  return (
    <MediaActorsProvider
      assetTypes={isSupportedAssetType(props.assetType) ? [props.assetType] : ['file', 'image']}
      client={client}
      document={currentDocument ?? undefined}
      excludeTagSlugs={[]}
      mode={{type: 'editAsset', assetId: selectedAssets[0]?._id}}
      onClose={onClose}
      selectedAssetIds={selectedAssets.map((asset) => asset._id)}
      showMediaLibraryAssets
    >
      <AssetBrowserDispatchProvider onSelect={props.onSelect}>
        <GlobalStyle />
        <PortalProvider element={portalElement}>
          <Dialogs />
        </PortalProvider>
      </AssetBrowserDispatchProvider>
    </MediaActorsProvider>
  )
}

export default EditAssetTool
