import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {EditIcon} from '@sanity/icons/Edit'
import {WarningFilledIcon} from '@sanity/icons/WarningFilled'
import {
  Box,
  Checkbox,
  Container,
  Flex,
  Spinner,
  Text,
  type Theme,
  type ThemeColorSchemeKey,
} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {Tooltip} from '@sanity/ui/tooltip'
import {useSelector} from '@xstate/react'
import {type DragEvent, memo, type MouseEvent} from 'react'
import {useColorSchemeValue} from 'sanity'
import {styled, css} from 'styled-components'

import {PANEL_HEIGHT} from '../../constants'
import {useAssetSourceActions} from '../../contexts/AssetSourceDispatchContext'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {assetEditDialog} from '../../machines/dialogs'
import {setDragAssetIds} from '../../utils/assetDrag'
import {getSchemeColor} from '../../utils/getSchemeColor'
import imageDprUrl from '../../utils/imageDprUrl'
import {isFileAsset, isImageAsset} from '../../utils/typeGuards'
import FileIcon from '../FileIcon'
import Image from '../Image'

type Props = {
  id: string
  selected: boolean
  source?: string
}

const CardWrapper = styled(Flex)`
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
`

// oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
const CardContainer = styled(Flex)<{$picked?: boolean; theme: Theme; $updating?: boolean}>(({
  $picked,
  theme,
  $updating,
}) => {
  return css`
    border: 1px solid transparent;
    height: 100%;
    pointer-events: ${$updating ? 'none' : 'auto'};
    position: relative;
    transition: all 300ms;
    user-select: none;
    width: 100%;

    border: ${
      // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
      $picked ? `1px solid ${theme.sanity.color.spot.orange} !important` : '1px solid inherit'
    };

    ${
      !$updating &&
      css`
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            border: 1px solid var(--card-border-color);
          }
        }
      `
    }
  `
})

// oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
const ContextActionContainer = styled<typeof Flex, {$scheme: ThemeColorSchemeKey}>(Flex)(({
  $scheme,
}) => {
  return css`
    cursor: pointer;
    height: ${PANEL_HEIGHT}px;
    transition: all 300ms;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: ${getSchemeColor($scheme, 'bg')};
      }
    }
  `
})

const StyledWarningOutlineIcon = styled(WarningFilledIcon)(({theme}) => {
  return {
    // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
    color: theme.sanity.color.spot.red,
  }
})

const CardAsset = (props: Props) => {
  const {id, selected, source} = props

  const scheme = useColorSchemeValue()
  const toast = useToast()

  const {assets, dialogs} = useMediaActors()
  const item = useSelector(assets, (snapshot) => snapshot.context.byIds[id])

  const asset = item?.asset
  const error = item?.error
  const isOpaque = item?.asset?.metadata?.isOpaque
  const picked = item?.picked
  const updating = item?.updating

  const {isMultiSelect, onSelect} = useAssetSourceActions()

  // Short circuit if no asset is available
  if (!asset) {
    return null
  }

  const handleReplaceAsset = () => {
    // Resolved on click, so the replace target never re-renders the card
    const snapshot = assets.getSnapshot()
    const pickedAssets = selectPickedAssets(snapshot)
    const targetId =
      snapshot.context.replace?.assetId ??
      (pickedAssets.length === 1 ? pickedAssets[0]?.asset._id : undefined)
    if (!targetId || !isImageAsset(asset) || snapshot.context.byIds[targetId]?.updating) {
      return
    }

    assets.send({type: 'asset.references.replace', asset, targetId})
    toast.push({
      status: 'info',
      title:
        'Updating in progress. Depending on the amount of changes, this could take a few minutes.',
    })
    dialogs.send({type: 'dialogs.clear'})
  }

  const togglePick = () => assets.send({type: 'pick.toggle', assetId: asset._id})
  // Picks every asset between the last picked asset and this one
  const pickRange = () => assets.send({type: 'pick.range', assetId: asset._id})
  const openAsset = () => dialogs.send({type: 'dialog.open', dialog: assetEditDialog(asset._id)})

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
      if (e.shiftKey && !picked) {
        pickRange()
      } else {
        togglePick()
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd-click toggles a single pick without opening the asset
      togglePick()
    } else if (e.shiftKey) {
      if (picked) {
        togglePick()
      } else {
        pickRange()
      }
    } else {
      openAsset()
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
      openAsset()
    } else if (e.shiftKey && !picked) {
      pickRange()
    } else {
      togglePick()
    }
  }

  // Dragging a picked asset drags every picked asset; dragging an unpicked asset drags only itself.
  const draggable = !selected && !updating && source !== 'replace-asset'

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    const assetIds = picked
      ? selectPickedAssets(assets.getSnapshot()).map((pickedItem) => pickedItem.asset._id)
      : [asset._id]
    setDragAssetIds(e, assetIds)
  }

  const opacityContainer = updating ? 0.5 : 1
  const opacityPreview = selected || updating ? 0.25 : 1

  return (
    <CardWrapper padding={1}>
      <CardContainer
        direction="column"
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
        $picked={picked}
        $updating={item.updating}
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
                $scheme={scheme}
                $showCheckerboard={!isOpaque}
                src={imageDprUrl(asset, {height: 250, width: 250})}
                style={{
                  draggable: false,
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
        <ContextActionContainer
          align="center"
          onClick={handleContextActionClick}
          paddingX={1}
          $scheme={scheme}
          style={{opacity: opacityContainer}}
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
        </ContextActionContainer>

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
                <StyledWarningOutlineIcon color="critical" />
              </Text>
            </Tooltip>
          </Box>
        )}
      </CardContainer>
    </CardWrapper>
  )
}

export default memo(CardAsset)
