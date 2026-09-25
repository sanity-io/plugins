import {Box, Button, Flex, Label} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import pluralize from 'pluralize'
import {useColorSchemeValue} from 'sanity'

import {PANEL_HEIGHT} from '../../constants'
import {useAssetSourceActions} from '../../contexts/AssetSourceDispatchContext'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {
  confirmDeleteAssetsDialog,
  folderMoveDialog,
  replaceAssetDialog,
} from '../../machines/dialogs'
import {getSchemeColor} from '../../utils/getSchemeColor'
import {isImageAsset} from '../../utils/typeGuards'

const PickedBar = () => {
  const scheme = useColorSchemeValue()

  const {assets, dialogs} = useMediaActors()
  const assetsPicked = useSelector(assets, selectPickedAssets)
  const currentFolderId = useSelector(assets, (snapshot) => snapshot.context.currentFolderId)
  const {isMultiSelect, onSelect} = useAssetSourceActions()

  // Replace only rewrites image field refs — only offer it for a single image asset.
  const canReplace =
    assetsPicked.length === 1 && !!assetsPicked[0] && isImageAsset(assetsPicked[0].asset)

  // Callbacks
  const handlePickClear = () => {
    assets.send({type: 'pick.clear'})
  }

  const handleDeletePicked = () => {
    dialogs.send({type: 'dialog.open', dialog: confirmDeleteAssetsDialog(assetsPicked)})
  }

  const handleReplaceImages = () => {
    const assetId = assetsPicked[0]?.asset._id
    if (!assetId) {
      return
    }
    dialogs.send({type: 'dialog.open', dialog: replaceAssetDialog(assetId)})
  }

  const handleMovePicked = () =>
    dialogs.send({type: 'dialog.open', dialog: folderMoveDialog(assetsPicked, currentFolderId)})

  const handleRemovePickedFromFolder = () =>
    assets.send({type: 'assets.folder.set', assets: assetsPicked, folderId: null})

  const handleInsertPicked = () => {
    if (!onSelect) {
      return
    }

    const pickedAssetIds = assetsPicked.map((item) => ({
      kind: 'assetDocumentId' as const,
      value: item.asset._id,
    }))

    if (pickedAssetIds.length === 0) {
      return
    }

    onSelect(pickedAssetIds)
  }

  if (assetsPicked.length === 0) {
    return null
  }

  return (
    <Flex
      align="center"
      justify="flex-start"
      style={{
        background: getSchemeColor(scheme, 'bg'),
        borderBottom: '1px solid var(--card-border-color)',
        height: `${PANEL_HEIGHT}px`,
        position: 'relative',
        width: '100%',
      }}
    >
      <Flex align="center" paddingX={3}>
        <Box paddingRight={2}>
          <Label size={0} style={{color: 'inherit'}}>
            {assetsPicked.length} {pluralize('asset', assetsPicked.length)} selected
          </Label>
        </Box>

        {/* Deselect button */}
        <Button
          mode="bleed"
          onClick={handlePickClear}
          padding={2}
          style={{background: 'none', boxShadow: 'none'}}
          tone="default"
        >
          <Label size={0}>Deselect</Label>
        </Button>

        {onSelect && isMultiSelect ? (
          <Button
            mode="bleed"
            onClick={handleInsertPicked}
            padding={2}
            style={{background: 'none', boxShadow: 'none'}}
            tone="primary"
          >
            <Label size={0}>Insert selected</Label>
          </Button>
        ) : (
          <Button
            mode="bleed"
            onClick={handleDeletePicked}
            padding={2}
            style={{background: 'none', boxShadow: 'none'}}
            tone="critical"
          >
            <Label size={0}>Delete</Label>
          </Button>
        )}

        {/* Replace button */}
        {canReplace && (
          <Button
            mode="bleed"
            onClick={handleReplaceImages}
            padding={2}
            style={{background: 'none', boxShadow: 'none'}}
            tone="default"
          >
            <Label size={0}>Replace</Label>
          </Button>
        )}

        {!onSelect && (
          <>
            <Button
              mode="bleed"
              onClick={handleMovePicked}
              padding={2}
              style={{background: 'none', boxShadow: 'none'}}
              tone="primary"
            >
              <Label size={0}>Move to folder</Label>
            </Button>
            {currentFolderId && (
              <Button
                mode="bleed"
                onClick={handleRemovePickedFromFolder}
                padding={2}
                style={{background: 'none', boxShadow: 'none'}}
                tone="critical"
              >
                <Label size={0}>Remove from folder</Label>
              </Button>
            )}
          </>
        )}
      </Flex>
    </Flex>
  )
}

export default PickedBar
