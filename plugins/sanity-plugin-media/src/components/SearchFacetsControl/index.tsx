import {AddIcon} from '@sanity/icons/Add'
import {Button, Flex} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuGroup, MenuItem} from '@sanity/ui/menu'
import {useSelector} from '@xstate/react'

import {FACETS} from '../../constants'
import {useMediaActors, useMediaConfig} from '../../contexts/MediaActorsContext'
import {useToolOptions} from '../../contexts/ToolOptionsContext'
import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'
import type {SearchFacetDivider, SearchFacetGroup, SearchFacetInputProps} from '../../types'

const SearchFacetsControl = () => {
  const {assets} = useMediaActors()
  const {assetTypes, document: selectedDocument} = useMediaConfig()
  const searchFacets = useSelector(assets, (snapshot) => snapshot.context.searchFacets)

  const popoverProps = usePortalPopoverProps()

  const {creditLine} = useToolOptions()

  const isTool = !selectedDocument

  const filteredFacets = FACETS
    // Filter facets based on current context, whether it's invoked as a tool, or via selection through via custom asset source.
    .filter((facet) => {
      // Remove credit line filter if it's not enabled
      if (!creditLine?.enabled && facet?.type === 'string' && facet?.name === 'creditLine') {
        return false
      }

      if (facet.type === 'group' || facet.type === 'divider') {
        return true
      }

      if (isTool) {
        return !facet?.selectOnly
      }

      const matchingAssetTypes = facet.assetTypes.filter((assetType) =>
        assetTypes.includes(assetType),
      )
      return matchingAssetTypes.length > 0
    })
    // Remove adjacent and leading / trailing dividers
    .filter((facet, index, facets) => {
      const previousFacet = facets[index - 1]
      // Ignore leading + trailing dividers
      if (facet.type === 'divider' && (index === 0 || index === facets.length - 1)) {
        return false
      }
      // Ignore adjacent dividers
      if (facet.type === 'divider' && previousFacet?.type === 'divider') {
        return false
      }
      return true
    })

  const hasSearchFacets = filteredFacets.length > 0

  const renderMenuFacets = (
    facets: (SearchFacetDivider | SearchFacetGroup | SearchFacetInputProps)[],
    level: number = 0,
  ) => {
    return (
      <>
        {facets?.map((facet, index) => {
          if (facet.type === 'divider') {
            return <MenuDivider key={index} />
          }

          // Recursively render menu facets
          if (facet.type === 'group') {
            return (
              <MenuGroup key={`group-${level}-${index}`} text={facet.title} title={facet.title}>
                {renderMenuFacets(facet.facets, level + 1)}
              </MenuGroup>
            )
          }

          if (facet) {
            const disabled =
              !facet.operatorTypes && !!searchFacets.find((v) => v.name === facet.name)

            return (
              <MenuItem
                disabled={disabled}
                fontSize={1}
                key={facet.name}
                onClick={() => assets.send({type: 'search.facet.add', facet})}
                padding={2}
                text={facet.title}
              />
            )
          }

          return null
        })}
      </>
    )
  }

  return (
    <Flex>
      {/* Add filter button */}
      <MenuButton
        button={
          <Button
            disabled={!hasSearchFacets}
            fontSize={1}
            icon={AddIcon}
            mode="bleed"
            gap={2}
            text="Add filter"
            tone="primary"
          />
        }
        id="facets"
        menu={<Menu>{renderMenuFacets(filteredFacets)}</Menu>}
        popover={{
          ...popoverProps,
          placement: 'right-start',
        }}
      />

      {/* Clear facets button */}
      {searchFacets.length > 0 && (
        <Button
          fontSize={1}
          mode="bleed"
          onClick={() => assets.send({type: 'search.facets.clear'})}
          text="Clear"
        />
      )}
    </Flex>
  )
}

export default SearchFacetsControl
