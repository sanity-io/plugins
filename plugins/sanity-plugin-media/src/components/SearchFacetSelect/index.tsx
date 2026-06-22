// oxlint-disable react/no-array-index-key - legacy code will be lint-cleaned in a follow-up PR
import {SelectIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import {useDispatch} from 'react-redux'

import {operators} from '../../config/searchFacets'
import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'
import {searchActions} from '../../modules/search'
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
  // Redux
  const dispatch = useDispatch()

  const popoverProps = usePortalPopoverProps()

  const options = facet?.options

  const selectedItem = options?.find((v) => v.name === facet?.value)

  const handleListItemClick = (option: SearchFacetInputSelectListItemProps) => {
    dispatch(searchActions.facetsUpdate({name: facet.name, value: option.name}))
  }

  const handleOperatorItemClick = (operatorType: SearchFacetOperatorType) => {
    dispatch(searchActions.facetsUpdate({name: facet.name, operatorType}))
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
