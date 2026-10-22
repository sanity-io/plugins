import {SelectIcon} from '@sanity/icons/Select'
import {Box, Button} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useSelector} from '@xstate/react'
import Select from 'react-select'
import {useColorSchemeValue} from 'sanity'

import {operators} from '../../config/searchFacets'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {useToolOptions} from '../../contexts/ToolOptionsContext'
import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'
import {selectIsFetchingTags, selectTags} from '../../machines/tagsMachine'
import {reactSelectComponents, reactSelectStyles} from '../../styled/react-select/single'
import type {
  TagSelectOption,
  SearchFacetInputSearchableProps,
  SearchFacetOperatorType,
  WithId,
} from '../../types'
import getTagSelectOptions from '../../utils/getTagSelectOptions'
import SearchFacet from '../SearchFacet'

type Props = {
  facet: WithId<SearchFacetInputSearchableProps>
}

const SearchFacetTags = ({facet}: Props) => {
  const scheme = useColorSchemeValue()

  const {assets, tags: tagsActor} = useMediaActors()
  const {excludeTagSlugs} = useToolOptions()
  const tagsAll = useSelector(tagsActor, selectTags)
  const tags =
    excludeTagSlugs.length > 0
      ? tagsAll.filter((t) => !excludeTagSlugs.includes(t.tag.name.current))
      : tagsAll
  const tagsFetching = useSelector(tagsActor, selectIsFetchingTags)
  const allTagOptions = getTagSelectOptions(tags)

  const popoverProps = usePortalPopoverProps()

  const handleChange = (option: TagSelectOption) => {
    assets.send({type: 'search.facet.update', facetId: facet.id, update: {value: option}})
  }

  const handleOperatorItemClick = (operatorType: SearchFacetOperatorType) => {
    assets.send({type: 'search.facet.update', facetId: facet.id, update: {operatorType}})
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
                      gap={4}
                      style={{minWidth: '150px'}}
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
        <Box marginX={1} style={{width: '160px'}}>
          <Select
            components={reactSelectComponents}
            instanceId="facet-searchable"
            isClearable
            isDisabled={tagsFetching}
            isSearchable
            name="tags"
            noOptionsMessage={() => 'No tags'}
            onChange={(value: any) => handleChange(value as TagSelectOption)}
            options={allTagOptions}
            placeholder={tagsFetching ? 'Loading...' : 'Select...'}
            styles={reactSelectStyles(scheme)}
            value={facet?.value}
          />
        </Box>
      )}
    </SearchFacet>
  )
}

export default SearchFacetTags
