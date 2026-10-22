import {Box, Flex, Inline, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties} from 'react'

import useTypedSelector from '../../hooks/useTypedSelector'
import SearchFacetNumber from '../SearchFacetNumber'
import SearchFacetSelect from '../SearchFacetSelect'
import SearchFacetString from '../SearchFacetString'
import SearchFacetTags from '../SearchFacetTags'

import * as styles from './SearchFacets.module.css'

type Props = {
  layout?: 'inline' | 'stack'
}

interface StackContainerStyle extends CSSProperties {
  '--media-stack-gap'?: string
}

const SearchFacets = (props: Props) => {
  const {layout = 'inline'} = props

  const {space} = useThemeV2()

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
        <Inline gap={2}>{Items}</Inline>
      </Box>
    )
  }

  if (layout === 'stack') {
    const stackContainerStyle: StackContainerStyle = {
      '--media-stack-gap': `${rem(space[2]!)}`,
    }

    return (
      <Flex
        align="flex-start"
        className={styles.stackContainer}
        direction="column"
        style={stackContainerStyle}
      >
        {Items}
      </Flex>
    )
  }

  throw Error('Invalid layout')
}

export default SearchFacets
