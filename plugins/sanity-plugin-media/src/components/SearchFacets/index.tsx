import {Box, Flex, Inline, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'

import useTypedSelector from '../../hooks/useTypedSelector'
import SearchFacetNumber from '../SearchFacetNumber'
import SearchFacetSelect from '../SearchFacetSelect'
import SearchFacetString from '../SearchFacetString'
import SearchFacetTags from '../SearchFacetTags'

import {marginBottomVar, stackContainer} from './SearchFacets.css'

type Props = {
  layout?: 'inline' | 'stack'
}

function StackContainer({className, style, ...props}: ComponentProps<typeof Flex>) {
  const {space} = useThemeV2()

  return (
    <Flex
      {...props}
      className={clsx(stackContainer, className)}
      style={{...style, ...assignInlineVars({[marginBottomVar]: `${rem(space[2]!)}`})}}
    />
  )
}

const SearchFacets = (props: Props) => {
  const {layout = 'inline'} = props

  // Redux
  const searchFacets = useTypedSelector((state) => state.search.facets)

  const Items = searchFacets.map((facet) => {
    const key = facet.id
    if (facet.type === 'number') {
      return <SearchFacetNumber facet={facet} key={key} />
    }

    if (facet.type === 'searchable') {
      return <SearchFacetTags facet={facet} key={key} />
    }

    if (facet.type === 'select') {
      return <SearchFacetSelect facet={facet} key={key} />
    }

    if (facet.type === 'string') {
      return <SearchFacetString facet={facet} key={key} />
    }

    return null
  })

  if (layout === 'inline') {
    if (searchFacets.length === 0) {
      return null
    }

    return (
      <Box marginBottom={2}>
        <Inline space={2}>{Items}</Inline>
      </Box>
    )
  }

  if (layout === 'stack') {
    return (
      <StackContainer align="flex-start" direction="column">
        {Items}
      </StackContainer>
    )
  }

  throw Error('Invalid layout')
}

export default SearchFacets
