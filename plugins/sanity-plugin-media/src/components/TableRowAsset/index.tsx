import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {EditIcon} from '@sanity/icons/Edit'
import {WarningFilledIcon} from '@sanity/icons/WarningFilled'
import {
  Box,
  Checkbox,
  Container,
  Flex,
  Grid,
  Spinner,
  Text,
  type ThemeColorSchemeKey,
  useMediaIndex,
} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useSelector} from '@xstate/react'
import {formatRelative} from 'date-fns/formatRelative'
import filesize from 'filesize'
import {type DragEvent, memo, type MouseEvent, useEffect, useRef, useState} from 'react'
import {WithReferringDocuments, useColorSchemeValue} from 'sanity'
import {styled, css} from 'styled-components'

import {GRID_TEMPLATE_COLUMNS} from '../../constants'
import {useAssetSourceActions} from '../../contexts/AssetSourceDispatchContext'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {assetEditDialog} from '../../machines/dialogs'
import {setDragAssetIds} from '../../utils/assetDrag'
import getAssetResolution from '../../utils/getAssetResolution'
import {getSchemeColor} from '../../utils/getSchemeColor'
import {getUniqueDocuments} from '../../utils/getUniqueDocuments'
import imageDprUrl from '../../utils/imageDprUrl'
import {isFileAsset, isImageAsset} from '../../utils/typeGuards'
import FileIcon from '../FileIcon'
import Image from '../Image'

// Duration (ms) to wait before reference counts (and associated listeners) are rendered
const REFERENCE_COUNT_VISIBILITY_DELAY = 750

type Props = {
  id: string
  selected: boolean
}

const ContainerGrid = styled<
  typeof Grid,
  // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
  {$selected?: boolean; $scheme: ThemeColorSchemeKey; $updating?: boolean}
>(Grid)(({$scheme, $selected, $updating}) => {
  return css`
    align-items: center;
    cursor: ${$selected ? 'default' : 'pointer'};
    height: 100%;
    pointer-events: ${$updating ? 'none' : 'auto'};
    user-select: none;
    white-space: nowrap;

    ${
      !$updating &&
      css`
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            background: ${getSchemeColor($scheme, 'bg')};
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
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: ${getSchemeColor($scheme, 'bg2')};
      }
    }
  `
})

const StyledWarningIcon = styled(WarningFilledIcon)(({theme}) => {
  return {
    // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
    color: theme.sanity.color.spot.red,
  }
})

const TableRowAsset = (props: Props) => {
  const {id, selected} = props

  const scheme = useColorSchemeValue()

  const [referenceCountVisible, setReferenceCountVisible] = useState(false)
  const refCountVisibleTimeout = useRef<ReturnType<typeof window.setTimeout>>(null)

  const {assets, dialogs} = useMediaActors()
  const item = useSelector(assets, (snapshot) => snapshot.context.byIds[id])

  const mediaIndex = useMediaIndex()

  const asset = item?.asset
  const error = item?.error
  const isOpaque = item?.asset?.metadata?.isOpaque
  const picked = item?.picked
  const updating = item?.updating

  const {isMultiSelect, onSelect} = useAssetSourceActions()

  const togglePick = (assetId: string) => assets.send({type: 'pick.toggle', assetId})
  // Picks every asset between the last picked asset and this one
  const pickRange = (assetId: string) => assets.send({type: 'pick.range', assetId})
  const openAsset = (assetId: string) =>
    dialogs.send({type: 'dialog.open', dialog: assetEditDialog(assetId)})

  const handleContextActionClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()

    if (!asset) return
    if (selected) return
    if (onSelect && !isMultiSelect) {
      openAsset(asset._id)
    } else if (e.shiftKey && !picked) {
      pickRange(asset._id)
    } else {
      togglePick(asset._id)
    }
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()

    if (!asset) return
    if (selected) return
    if (onSelect && !isMultiSelect) {
      onSelect([{kind: 'assetDocumentId', value: asset._id}])
    } else if (onSelect && isMultiSelect) {
      if (e.shiftKey && !picked) {
        pickRange(asset._id)
      } else {
        togglePick(asset._id)
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd-click toggles a single pick without opening the asset
      togglePick(asset._id)
    } else if (e.shiftKey) {
      if (picked) {
        togglePick(asset._id)
      } else {
        pickRange(asset._id)
      }
    } else {
      openAsset(asset._id)
    }
  }

  // Dragging a picked asset drags every picked asset; dragging an unpicked asset drags only itself.
  const draggable = !selected && !updating

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!asset) return
    const assetIds = picked
      ? selectPickedAssets(assets.getSnapshot()).map((pickedItem) => pickedItem.asset._id)
      : [asset._id]
    setDragAssetIds(e, assetIds)
  }

  const opacityCell = updating ? 0.5 : 1
  const opacityPreview = selected || updating ? 0.1 : 1

  // Display reference count after an initial delay to prevent over-eager fetching
  useEffect(() => {
    refCountVisibleTimeout.current = setTimeout(
      () => setReferenceCountVisible(true),
      REFERENCE_COUNT_VISIBILITY_DELAY,
    )
    return () => {
      if (refCountVisibleTimeout.current) {
        clearTimeout(refCountVisibleTimeout.current)
      }
    }
  }, [])

  // Short circuit if no asset is available
  if (!asset) {
    return null
  }

  return (
    <ContainerGrid
      draggable={draggable}
      onClick={selected ? undefined : handleClick}
      onDragStart={draggable ? handleDragStart : undefined}
      $scheme={scheme}
      $selected={selected}
      style={{
        columnGap: mediaIndex < 3 ? 0 : '16px',
        rowGap: 0,
        gridTemplateColumns:
          mediaIndex < 3 ? GRID_TEMPLATE_COLUMNS.SMALL : GRID_TEMPLATE_COLUMNS.LARGE,
        gridTemplateRows: mediaIndex < 3 ? 'auto' : '1fr',
      }}
      $updating={item.updating}
    >
      {/* Picked checkbox */}
      <ContextActionContainer
        onClick={handleContextActionClick}
        $scheme={scheme}
        style={{
          alignItems: 'center',
          gridColumn: 1,
          gridRowStart: 1,
          gridRowEnd: 'span 5',
          height: '100%',
          justifyContent: 'center',
          opacity: opacityCell,
          position: 'relative',
        }}
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
              pointerEvents: 'none', // TODO: consider alternative for usability
              transform: 'scale(0.8)',
            }}
          />
        )}
      </ContextActionContainer>

      {/* Preview image + spinner */}
      <Box
        style={{
          gridColumn: 2,
          gridRowStart: 1,
          gridRowEnd: 'span 5',
          height: '90px',
          width: '100px',
        }}
      >
        <Flex align="center" justify="center" style={{height: '100%', position: 'relative'}}>
          <Box style={{height: '100%', opacity: opacityPreview, position: 'relative'}}>
            {/* File icon */}
            {isFileAsset(asset) && <FileIcon extension={asset.extension} width="40px" />}

            {/* Image */}
            {isImageAsset(asset) && (
              <Image
                draggable={false}
                $scheme={scheme}
                $showCheckerboard={!isOpaque}
                src={imageDprUrl(asset, {height: 100, width: 100})}
              />
            )}
          </Box>

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

          {/* Selected check icon */}
          {selected && !updating && (
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
              <Text size={2}>
                <CheckmarkCircleIcon />
              </Text>
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Filename */}
      <Box
        marginLeft={mediaIndex < 3 ? 3 : 0}
        style={{
          gridColumn: 3,
          gridRow: mediaIndex < 3 ? 2 : 'auto',
          opacity: opacityCell,
        }}
      >
        <Text muted size={1} style={{lineHeight: '2em'}} textOverflow="ellipsis">
          {asset.originalFilename}
        </Text>
      </Box>

      {/* Resolution */}
      <Box
        marginLeft={mediaIndex < 3 ? 3 : 0}
        style={{
          gridColumn: mediaIndex < 3 ? 3 : 4,
          gridRow: mediaIndex < 3 ? 3 : 'auto',
          opacity: opacityCell,
        }}
      >
        <Text muted size={1} style={{lineHeight: '2em'}} textOverflow="ellipsis">
          {isImageAsset(asset) && getAssetResolution(asset)}
        </Text>
      </Box>

      {/* MIME type */}
      <Box
        style={{
          display: mediaIndex < 3 ? 'none' : 'block',
          gridColumn: 5,
          gridRow: 'auto',
          opacity: opacityCell,
        }}
      >
        <Text muted size={1} style={{lineHeight: '2em'}} textOverflow="ellipsis">
          {asset.mimeType}
        </Text>
      </Box>

      {/* Size */}
      <Box
        style={{
          display: mediaIndex < 3 ? 'none' : 'block',
          gridColumn: 6,
          gridRow: 'auto',
          opacity: opacityCell,
        }}
      >
        <Text muted size={1} style={{lineHeight: '2em'}} textOverflow="ellipsis">
          {filesize(asset.size, {base: 10, round: 0})}
        </Text>
      </Box>

      {/* Last updated */}
      <Box
        marginLeft={mediaIndex < 3 ? 3 : 0}
        style={{
          gridColumn: mediaIndex < 3 ? 3 : 7,
          gridRow: mediaIndex < 3 ? 4 : 'auto',
          opacity: opacityCell,
        }}
      >
        <Text muted size={1} style={{lineHeight: '2em'}} textOverflow="ellipsis">
          {formatRelative(new Date(asset._updatedAt), new Date())}
        </Text>
      </Box>

      {/* References */}
      <Box
        style={{
          display: mediaIndex < 3 ? 'none' : 'block',
          gridColumn: 8,
          gridRow: 'auto',
          opacity: opacityCell,
        }}
      >
        <Text muted size={1} style={{lineHeight: '2em'}} textOverflow="ellipsis">
          {referenceCountVisible ? (
            <WithReferringDocuments // oxlint-disable-line no-deprecated -- deferred to a follow-up PR
              id={id}
            >
              {({isLoading, referringDocuments}) => {
                const uniqueDocuments = getUniqueDocuments(referringDocuments)
                return isLoading ? (
                  <>-</>
                ) : (
                  <>{Array.isArray(uniqueDocuments) ? uniqueDocuments.length : 0}</>
                )
              }}
            </WithReferringDocuments>
          ) : (
            <>-</>
          )}
        </Text>
      </Box>

      {/* Error */}
      <Flex
        align="center"
        justify="center"
        style={{
          gridColumn: mediaIndex < 3 ? 4 : 9,
          gridRowStart: '1',
          gridRowEnd: mediaIndex < 3 ? 'span 5' : 'auto',
          opacity: opacityCell,
        }}
      >
        {/* TODO: DRY */}
        {/* Error button */}
        {error && (
          <Box padding={2}>
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
                <StyledWarningIcon color="critical" />
              </Text>
            </Tooltip>
          </Box>
        )}
      </Flex>
    </ContainerGrid>
  )
}

export default memo(TableRowAsset)
