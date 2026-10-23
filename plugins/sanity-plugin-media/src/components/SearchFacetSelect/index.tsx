import {SelectIcon} from '@sanity/icons/Select'
import {Box, Button} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'

import {operators} from '../../config/searchFacets'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'
import type {
  SearchFacetInputSelectListItemProps,
  SearchFacetInputSelectProps,
  SearchFacetOperatorType,
  WithId,
} from '../../types'
import SearchFacet from '../SearchFacet'

type Props = {
  facet: WithId<SearchFacetInputSelectProps>
}

const SearchFacetSelect = ({facet}: Props) => {
  const {assets} = useMediaActors()

  const popoverProps = usePortalPopoverProps()

  const options = facet?.options

  const selectedItem = options?.find((v) => v.name === facet?.value)

  const handleListItemClick = (option: SearchFacetInputSelectListItemProps) => {
    assets.send({type: 'search.facet.updateByName', name: facet.name, update: {value: option.name}})
  }

  const handleOperatorItemClick = (operatorType: SearchFacetOperatorType) => {
    assets.send({type: 'search.facet.updateByName', name: facet.name, update: {operatorType}})
  }

  const selectedOperatorType: SearchFacetOperatorType = facet?.operatorType ?? 'is'

  return (
    <SearchFacet facet={facet}>
      {/* Optional operators */}
      {facet?.operatorTypes && (
        <MenuButton
          button={
            <Box marginRight={1}>
              <Button
                fontSize={1}
                iconRight={SelectIcon}
                padding={2}
                text={operators[selectedOperatorType].label}
              />
            </Box>
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

      {/* List */}
      <MenuButton
        button={
          <Button fontSize={1} iconRight={SelectIcon} padding={2} text={selectedItem?.title} />
        }
        id="list"
        menu={
          <Menu>
            {options?.map((item) => {
              const selected = item.name === selectedItem?.name
              return (
                <MenuItem
                  disabled={selected}
                  fontSize={1}
                  key={item.name}
                  onClick={() => handleListItemClick(item)}
                  padding={2}
                  text={item.title}
                />
              )
            })}
          </Menu>
        }
        popover={popoverProps}
      />
    </SearchFacet>
  )
}

export default SearchFacetSelect
