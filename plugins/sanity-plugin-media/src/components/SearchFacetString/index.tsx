import {SelectIcon} from '@sanity/icons/Select'
import {Box, Button, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {type ChangeEvent} from 'react'

import {operators} from '../../config/searchFacets'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'
import type {SearchFacetInputStringProps, SearchFacetOperatorType, WithId} from '../../types'
import SearchFacet from '../SearchFacet'

type Props = {
  facet: WithId<SearchFacetInputStringProps>
}

const SearchFacetString = ({facet}: Props) => {
  const {assets} = useMediaActors()

  const popoverProps = usePortalPopoverProps()

  const handleOperatorItemClick = (operatorType: SearchFacetOperatorType) => {
    assets.send({type: 'search.facet.update', facetId: facet.id, update: {operatorType}})
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    assets.send({type: 'search.facet.update', facetId: facet.id, update: {value: e.target.value}})
  }

  const selectedOperatorType: SearchFacetOperatorType = facet.operatorType

  return (
    <SearchFacet facet={facet}>
      {/* Optional operators */}
      {facet?.operatorTypes && (
        <MenuButton
          button={
            <Button
              fontSize={1}
              iconRight={SelectIcon}
              padding={2}
              text={operators[selectedOperatorType].label}
            />
          }
          id="operators"
          menu={
            <Menu>
              {facet.operatorTypes.map((operatorType, index) => {
                if (operatorType) {
                  const selected = operatorType === selectedOperatorType
                  return (
                    <MenuItem
                      disabled={selected}
                      fontSize={1}
                      key={operatorType}
                      onClick={() => handleOperatorItemClick(operatorType)}
                      padding={2}
                      text={operators[operatorType].label}
                    />
                  )
                }

                return <MenuDivider key={index} />
              })}
            </Menu>
          }
          popover={popoverProps}
        />
      )}

      {/* Value */}
      {!operators[selectedOperatorType].hideInput && (
        <Box marginLeft={1} style={{maxWidth: '125px'}}>
          <TextInput
            fontSize={1}
            onChange={handleChange}
            padding={2}
            radius={2}
            width={2}
            value={facet?.value}
          />
        </Box>
      )}
    </SearchFacet>
  )
}

export default SearchFacetString
