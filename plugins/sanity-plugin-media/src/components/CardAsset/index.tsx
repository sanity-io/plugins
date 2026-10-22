import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {EditIcon} from '@sanity/icons/Edit'
import {WarningFilledIcon} from '@sanity/icons/WarningFilled'
import {Box, Checkbox, Container, Flex, Spinner, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {Tooltip} from '@sanity/ui/tooltip'
import {type CSSProperties, type DragEvent, memo, type MouseEvent, type RefObject} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {useAssetSourceActions} from '../../contexts/AssetSourceDispatchContext'
import useKeyPress from '../../hooks/useKeyPress'
import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions, selectAssetById, selectAssetsPicked} from '../../modules/assets'
import {dialogActions} from '../../modules/dialog'
import {setDragAssetIds} from '../../utils/assetDrag'
import {getSchemeColor} from '../../utils/getSchemeColor'
import imageDprUrl from '../../utils/imageDprUrl'
import {isFileAsset, isImageAsset} from '../../utils/typeGuards'
import FileIcon from '../FileIcon'
import Image from '../Image'

import * as styles from './CardAsset.module.css'

type Props = {
  id: string
  selected: boolean
  source?: string
}

interface CardContainerStyle extends CSSProperties {
  '--media-card-picked-border-color'?: string
}

interface ContextActionHoverStyle extends CSSProperties {
  '--media-context-action-hover-bg'?: string
}

const CardAsset = (props: Props) => {
  const {id, selected, source} = props

  const scheme = useColorSchemeValue()
  const toast = useToast()
  const {color} = useThemeV2()

  // Refs
  const shiftPressed: RefObject<boolean> = useKeyPress('shift')

  // Redux
  const dispatch = useDispatch()
  const lastPicked = useTypedSelector((state) => state.assets.lastPicked)
  const assetsPicked = useTypedSelector(selectAssetsPicked)
  const item = useTypedSelector((state) => selectAssetById(state, id))
  // Dialog carries the replace target so search refetch (which clears allIds/picks) is safe.
  const dialogReplaceAssetId = useTypedSelector((state) => {
    if (source !== 'replace-asset') {
      return undefined
    }
    const dialog = state.dialog.items.find((d) => d.type === 'dialogAllAssets')
    return dialog?.type === 'dialogAllAssets' ? dialog.assetId : undefined
  })

  const asset = item?.asset
  const error = item?.error
  const isOpaque = item?.asset?.metadata?.isOpaque
  const picked = item?.picked
  const updating = item?.updating

  // Prefer dialog assetId; fall back to the single currently-picked asset (not lastPicked).
  const assetToReplaceId =
    dialogReplaceAssetId ??
    (source === 'replace-asset' && assetsPicked.length === 1
      ? assetsPicked[0]?.asset._id
      : undefined)

  const assetToReplace = useTypedSelector((state) =>
    assetToReplaceId ? selectAssetById(state, assetToReplaceId) : undefined,
  )

  const {isMultiSelect, onSelect} = useAssetSourceActions()

  // Short circuit if no asset is available
  if (!asset) {
    return null
  }

  const handleReplaceAsset = () => {
    if (!assetToReplaceId || !isImageAsset(asset) || assetToReplace?.updating) {
      return
    }

    dispatch(assetsActions.updateImageReferences({asset, id: assetToReplaceId}))
    toast.push({
      status: 'info',
      title:
        'Updating in progress. Depending on the amount of changes, this could take a few minutes.',
    })
    dispatch(dialogActions.clear())
  }

  // Callbacks
  const handleAssetClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()

    if (source === 'replace-asset') {
      handleReplaceAsset()
      return
    }

    if (selected) {
      return
    }

    if (onSelect && !isMultiSelect) {
      onSelect([
        {
          kind: 'assetDocumentId',
          value: asset._id,
        },
      ])
    } else if (onSelect && isMultiSelect) {
      if (shiftPressed.current && !picked) {
        dispatch(assetsActions.pickRange({startId: lastPicked || asset._id, endId: asset._id}))
      } else {
        dispatch(assetsActions.pick({assetId: asset._id, picked: !picked}))
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd-click toggles a single pick without opening the asset
      dispatch(assetsActions.pick({assetId: asset._id, picked: !picked}))
    } else if (shiftPressed.current) {
      if (picked) {
        dispatch(assetsActions.pick({assetId: asset._id, picked: !picked}))
      } else {
        dispatch(assetsActions.pickRange({startId: lastPicked || asset._id, endId: asset._id}))
      }
    } else {
      dispatch(dialogActions.showAssetEdit({assetId: asset._id}))
    }
  }

  const handleContextActionClick = (e: MouseEvent) => {
    e.stopPropagation()

    if (source === 'replace-asset') {
      handleReplaceAsset()
      return
    }

    if (selected) {
      return
    }

    if (onSelect && !isMultiSelect) {
      dispatch(dialogActions.showAssetEdit({assetId: asset._id}))
    } else if (shiftPressed.current && !picked) {
      dispatch(assetsActions.pickRange({startId: lastPicked || asset._id, endId: asset._id}))
    } else {
      dispatch(assetsActions.pick({assetId: asset._id, picked: !picked}))
    }
  }

  // Dragging a picked asset drags every picked asset; dragging an unpicked asset drags only itself.
  const draggable = !selected && !updating && source !== 'replace-asset'

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    const assetIds = picked ? assetsPicked.map((pickedItem) => pickedItem.asset._id) : [asset._id]
    setDragAssetIds(e, assetIds)
  }

  const opacityContainer = updating ? 0.5 : 1
  const opacityPreview = selected || updating ? 0.25 : 1

  const cardContainerStyle: CardContainerStyle = {
    '--media-card-picked-border-color': color.avatar.orange.bg,
  }
  const contextActionHoverStyle: ContextActionHoverStyle = {
    '--media-context-action-hover-bg': getSchemeColor(scheme, 'bg'),
  }

  return (
    <Flex className={styles.cardWrapper} padding={1}>
      <Flex
        className={styles.cardContainer}
        data-picked={picked}
        data-updating={item.updating}
        direction="column"
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
        style={cardContainerStyle}
      >
        {/* Image */}
        <Box
          flex={1}
          style={{
            cursor: selected ? 'default' : 'pointer',
            position: 'relative',
          }}
        >
          <div
            data-testid={`media-asset-card-${asset._id}`}
            onClick={handleAssetClick}
            style={{height: '100%', opacity: opacityPreview}}
          >
            {/* File icon */}
            {isFileAsset(asset) && <FileIcon extension={asset.extension} width="80px" />}

            {/* Image */}
            {isImageAsset(asset) && (
              <Image
                draggable={false}
                scheme={scheme}
                showCheckerboard={!isOpaque}
                src={imageDprUrl(asset, {height: 250, width: 250})}
                style={{
                  transition: 'opacity 1000ms',
                }}
              />
            )}
          </div>

          {/* Selected check icon */}
          {selected && !updating && (
            <Flex
              align="center"
              justify="center"
              style={{
                height: '100%',
                left: 0,
                opacity: opacityContainer,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              <Text size={2}>
                <CheckmarkCircleIcon />
              </Text>
            </Flex>
          )}

          {/* Spinner */}
          {updating && (
            <Flex
              align="center"
              justify="center"
              style={{
                height: '100%',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              <Spinner />
            </Flex>
          )}
        </Box>

        {/* Footer */}
        <Flex
          align="center"
          className={styles.contextActionContainer}
          onClick={handleContextActionClick}
          paddingX={1}
          style={{...contextActionHoverStyle, opacity: opacityContainer}}
        >
          {onSelect && !isMultiSelect ? (
            <EditIcon
              style={{
                flexShrink: 0,
                opacity: 0.5,
              }}
            />
          ) : (
            <Checkbox
              checked={picked}
              readOnly
              style={{
                flexShrink: 0,
                pointerEvents: 'none',
                transform: 'scale(0.8)',
              }}
            />
          )}

          <Box marginLeft={2}>
            <Text muted size={0} textOverflow="ellipsis">
              {asset.originalFilename}
            </Text>
          </Box>
        </Flex>

        {/* TODO: DRY */}
        {/* Error button */}
        {error && (
          <Box
            padding={3}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          >
            <Tooltip
              animate
              content={
                <Container padding={2} width={0}>
                  <Text size={1}>{error}</Text>
                </Container>
              }
              placement="left"
              portal
            >
              <Text size={1}>
                <WarningFilledIcon color="critical" style={{color: color.avatar.red.bg}} />
              </Text>
            </Tooltip>
          </Box>
        )}
      </Flex>
    </Flex>
  )
}

export default memo(CardAsset)
