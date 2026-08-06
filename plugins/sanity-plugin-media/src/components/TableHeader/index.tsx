import {Checkbox, Flex, Grid, type ThemeColorSchemeKey, useMediaIndex} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps, type MouseEvent} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {GRID_TEMPLATE_COLUMNS, PANEL_HEIGHT} from '../../constants'
import {useAssetSourceActions} from '../../contexts/AssetSourceDispatchContext'
import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions, selectAssetsLength, selectAssetsPickedLength} from '../../modules/assets'
import {getSchemeColor} from '../../utils/getSchemeColor'
import TableHeaderItem from '../TableHeaderItem'

import {contextActionContainer, hoverBgVar} from './TableHeader.css'

// TODO: DRY
function ContextActionContainer({
  className,
  scheme,
  style,
  ...props
}: ComponentProps<typeof Flex> & {scheme: ThemeColorSchemeKey}) {
  return (
    <Flex
      {...props}
      className={clsx(contextActionContainer, className)}
      style={{...style, ...assignInlineVars({[hoverBgVar]: getSchemeColor(scheme, 'bg')})}}
    />
  )
}

const TableHeader = () => {
  const scheme = useColorSchemeValue()

  // Redux
  const dispatch = useDispatch()
  const fetching = useTypedSelector((state) => state.assets.fetching)
  const itemsLength = useTypedSelector(selectAssetsLength)
  const numPickedAssets = useTypedSelector(selectAssetsPickedLength)

  const mediaIndex = useMediaIndex()
  const {onSelect} = useAssetSourceActions()

  const allSelected = numPickedAssets === itemsLength

  // Callbacks
  const handleContextActionClick = (e: MouseEvent) => {
    e.stopPropagation()

    if (allSelected) {
      dispatch(assetsActions.pickClear())
    } else {
      dispatch(assetsActions.pickAll())
    }
  }

  // Note that even though we hide the table header on smaller breakpoints, we never set it to
  // `display: none`, as doing so causes issues with react-virtuoso.
  // Instead, we give it 0 height and hide it with `visibility: hidden`.
  return (
    <Grid
      style={{
        alignItems: 'center',
        background: 'var(--card-bg-color)',
        borderBottom: '1px solid var(--card-border-color)',
        gridColumnGap: mediaIndex < 3 ? 0 : '16px',
        gridTemplateColumns: GRID_TEMPLATE_COLUMNS.LARGE,
        height: mediaIndex < 3 ? 0 : `${PANEL_HEIGHT}px`,
        letterSpacing: '0.025em',
        position: 'sticky',
        textTransform: 'uppercase',
        top: 0,
        visibility: mediaIndex < 3 ? 'hidden' : 'visible',
        width: '100%',
        zIndex: 1, // force stacking context
      }}
    >
      {onSelect ? (
        <TableHeaderItem />
      ) : (
        <ContextActionContainer
          align="center"
          justify="center"
          onClick={handleContextActionClick}
          scheme={scheme}
          style={{
            height: '100%',
            position: 'relative',
          }}
        >
          <Checkbox
            checked={!fetching && allSelected}
            readOnly
            style={{
              pointerEvents: 'none', // TODO: consider alternative for usability
              transform: 'scale(0.8)',
            }}
          />
        </ContextActionContainer>
      )}

      <TableHeaderItem />
      <TableHeaderItem field="originalFilename" title="Filename" />
      <TableHeaderItem title="Resolution" />
      <TableHeaderItem field="mimeType" title="MIME type" />
      <TableHeaderItem field="size" title="Size" />
      <TableHeaderItem field="_updatedAt" title="Last updated" />
      <TableHeaderItem title="References" />
      <TableHeaderItem />
    </Grid>
  )
}

export default TableHeader
