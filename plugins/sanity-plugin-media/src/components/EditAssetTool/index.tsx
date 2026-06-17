import {PortalProvider} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {useDispatch} from 'react-redux'
import {type AssetSourceComponentProps, type SanityDocument, useFormValue} from 'sanity'

import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import useTypedSelector from '../../hooks/useTypedSelector'
import useVersionedClient from '../../hooks/useVersionedClient'
import {assetsActions} from '../../modules/assets'
import {dialogActions} from '../../modules/dialog'
import GlobalStyle from '../../styled/GlobalStyles'
import constructFilter from '../../utils/constructFilter'
import Dialogs from '../Dialogs'
import Notifications from '../Notifications'
import ReduxProvider from '../ReduxProvider'

/**
 * Fetches the already-selected asset into the store and opens the `assetEdit`
 * dialog for it. Once that dialog (and any nested dialogs, e.g. delete confirm)
 * are dismissed, the asset source itself is closed via `onClose`.
 *
 * Tracking the dialog lifecycle through redux is what allows the source to be
 * reopened: closing the inner dialog only removes it from the store, so without
 * this the source would stay mounted (showing nothing) and could not be opened
 * a second time.
 */
const EditAssetDialog = ({assetId, onClose}: {assetId: string; onClose: () => void}) => {
  const dispatch = useDispatch()
  const openDialogCount = useTypedSelector((state) => state.dialog.items.length)
  const hasOpenedRef = useRef(false)

  useEffect(() => {
    // Only fetch the single asset being edited, then open its edit dialog.
    const queryFilter = `${constructFilter({
      assetTypes: ['file', 'image'],
      searchFacets: [],
    })} && _id == $documentId`

    dispatch(assetsActions.fetchRequest({params: {documentId: assetId}, queryFilter}))
    dispatch(dialogActions.showAssetEdit({assetId}))
  }, [assetId, dispatch])

  useEffect(() => {
    if (openDialogCount > 0) {
      hasOpenedRef.current = true
    } else if (hasOpenedRef.current) {
      onClose()
    }
  }, [openDialogCount, onClose])

  return (
    <>
      <Dialogs />
      <Notifications />
    </>
  )
}

const EditAssetTool = (props: AssetSourceComponentProps) => {
  const {onClose, selectedAssets} = props

  const portalElement = useRootPortalElement()

  // Get current Sanity document
  const currentDocument = useFormValue([]) as SanityDocument

  const client = useVersionedClient()

  const assetId = selectedAssets[0]?._id

  // Nothing to edit (e.g. opened on an empty field) – close the source again.
  useEffect(() => {
    if (!assetId) {
      onClose()
    }
  }, [assetId, onClose])

  if (!assetId) {
    return null
  }

  return (
    <ReduxProvider
      assetType={props.assetType}
      client={client}
      document={currentDocument}
      selectedAssets={selectedAssets}
    >
      <AssetBrowserDispatchProvider onSelect={props.onSelect}>
        <GlobalStyle />
        <PortalProvider element={portalElement}>
          <EditAssetDialog assetId={assetId} onClose={onClose} />
        </PortalProvider>
      </AssetBrowserDispatchProvider>
    </ReduxProvider>
  )
}

export default EditAssetTool

const useRootPortalElement = () => {
  const [container] = useState(() => document.createElement('div'))

  useEffect(() => {
    container.classList.add('media-portal')
    document.body.appendChild(container)
    return () => {
      document.body.removeChild(container)
    }
  }, [container])

  return container
}
