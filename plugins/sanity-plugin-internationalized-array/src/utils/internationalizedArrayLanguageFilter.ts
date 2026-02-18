import type {FilterFieldFunction} from '@sanity/language-filter'

import {isInternationalizedArrayItemType} from '../types'

/**
 * Default filter function for the internationalized array field.
 * It filter the field base on the `language` value of the object.
 */
export const internationalizedArrayLanguageFilter: FilterFieldFunction = (
  enclosingType,
  _member,
  selectedLanguageIds,
  parentValue,
) => {
  if (isInternationalizedArrayItemType(enclosingType.name)) {
    const language =
      typeof parentValue?.['language'] === 'string' ? parentValue?.['language'] : null
    return language ? selectedLanguageIds.includes(language) : false
  }
  return true
}
