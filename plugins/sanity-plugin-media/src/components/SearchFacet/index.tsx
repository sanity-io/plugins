import {CloseIcon} from '@sanity/icons/Close'
import {Box, Flex, Label, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type ReactNode} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {searchActions} from '../../modules/search'
import type {SearchFacetInputProps, WithId} from '../../types'
import {getSchemeColor} from '../../utils/getSchemeColor'

type Props = {
  children: ReactNode
  facet: WithId<SearchFacetInputProps>
}

const SearchFacet = (props: Props) => {
  const {children, facet} = props

  const scheme = useColorSchemeValue()
  const {radius} = useThemeV2()

  // Redux
  const dispatch = useDispatch()

  const handleClose = () => {
    dispatch(searchActions.facetsRemoveById({facetId: facet.id}))
  }

  return (
    <Box
      padding={[2, 2, 1]}
      style={{
        background: getSchemeColor(scheme, 'bg'),
        borderRadius: rem(radius[2]!),
      }}
    >
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
    </Box>
  )
}

export default SearchFacet
