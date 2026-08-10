import {CloseIcon} from '@sanity/icons/Close'
import {
  Box,
  Flex,
  Label,
  rem,
  Text,
  type ThemeColorSchemeKey,
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps, type ReactNode} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {searchActions} from '../../modules/search'
import type {SearchFacetInputProps, WithId} from '../../types'
import {getSchemeColor} from '../../utils/getSchemeColor'

import {bgVar, borderRadiusVar, container} from './SearchFacet.css'

type Props = {
  children: ReactNode
  facet: WithId<SearchFacetInputProps>
}

function Container({
  className,
  scheme,
  style,
  ...props
}: ComponentProps<typeof Box> & {scheme: ThemeColorSchemeKey}) {
  const {radius} = useThemeV2()

  return (
    <Box
      {...props}
      className={clsx(container, className)}
      style={{
        ...style,
        ...assignInlineVars({
          [bgVar]: getSchemeColor(scheme, 'bg'),
          [borderRadiusVar]: `${rem(radius[2]!)}`,
        }),
      }}
    />
  )
}

const SearchFacet = (props: Props) => {
  const {children, facet} = props

  const scheme = useColorSchemeValue()

  // Redux
  const dispatch = useDispatch()

  const handleClose = () => {
    dispatch(searchActions.facetsRemoveById({facetId: facet.id}))
  }

  return (
    <Container padding={[2, 2, 1]} scheme={scheme}>
      <Flex align={['flex-start', 'flex-start', 'center']} direction={['column', 'column', 'row']}>
        {/* Title */}
        <Box paddingBottom={[3, 3, 0]} paddingLeft={1} paddingRight={2} paddingTop={[1, 1, 0]}>
          <Label
            size={0}
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            {facet.title}
          </Label>
        </Box>

        <Flex align="center">
          {children}

          {/* Close button */}
          <Box marginLeft={1} paddingX={2}>
            <Text muted size={0}>
              <CloseIcon onClick={handleClose} />
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Container>
  )
}

export default SearchFacet
