import {Box, Button, Flex} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useCallback, useState} from 'react'
import {useDispatch} from 'react-redux'

import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions, selectAssetById} from '../../modules/assets'
import {dialogActions} from '../../modules/dialog'
import type {DialogAllAssetsProps, ImageAsset} from '../../types'
import {isImageAsset} from '../../utils/typeGuards'
import Dialog from '../Dialog'
import ReplaceAssetConfirm from '../ReplaceAssetConfirm'
import ReplaceAssetsOverview, {
  initialReplaceAssetsFilterState,
  type ReplaceAssetsFilterState,
} from '../ReplaceAssetsOverView'

type Props = {
  children: ReactNode
  dialog: DialogAllAssetsProps
}

const DialogAllAssets = (props: Props) => {
  const {
    children,
    dialog: {assetId, id},
  } = props

  // Redux
  const dispatch = useDispatch()
  const assetToReplaceItem = useTypedSelector((state) => selectAssetById(state, assetId))

  const toast = useToast()

  // Kept here so going back from the confirmation step restores the search.
  const [filterState, setFilterState] = useState<ReplaceAssetsFilterState>(
    initialReplaceAssetsFilterState,
  )
  const [replacement, setReplacement] = useState<ImageAsset | null>(null)

  const assetToReplace =
    assetToReplaceItem && isImageAsset(assetToReplaceItem.asset)
      ? assetToReplaceItem.asset
      : undefined
  const updating = Boolean(assetToReplaceItem?.updating)

  // Callbacks
  const handleClose = useCallback(() => {
    dispatch(dialogActions.clear())
  }, [dispatch])

  const handleBack = () => {
    setReplacement(null)
  }

  const handleReplace = () => {
    if (!replacement || updating) {
      return
    }

    dispatch(assetsActions.updateImageReferences({asset: replacement, id: assetId}))
    toast.push({
      status: 'info',
      title:
        'Updating in progress. Depending on the amount of changes, this could take a few minutes.',
    })
    dispatch(dialogActions.clear())
  }

  const footer = replacement ? (
    <Flex gap={2} justify="flex-end" padding={3}>
      <Button fontSize={1} mode="bleed" onClick={handleBack} text="Back" />
      <Button
        disabled={updating}
        fontSize={1}
        onClick={handleReplace}
        text="Replace image"
        tone="primary"
      />
    </Flex>
  ) : undefined

  return (
    <Dialog
      footer={footer}
      header={replacement ? 'Confirm replacement' : 'Choose a replacement image'}
      id={id}
      onClose={handleClose}
      width={3}
    >
      {replacement ? (
        <Box padding={4}>
          <ReplaceAssetConfirm
            assetToReplace={assetToReplace}
            assetToReplaceId={assetId}
            replacement={replacement}
          />
        </Box>
      ) : (
        <Box padding={4} style={{height: '60vh'}}>
          <ReplaceAssetsOverview
            assetToReplaceId={assetId}
            filterState={filterState}
            onFilterStateChange={setFilterState}
            onSelect={setReplacement}
          />
        </Box>
      )}

      {children}
    </Dialog>
  )
}

export default DialogAllAssets
