import type {ObjectSchemaType, FieldMember, FieldsetState} from 'sanity'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {isInternationalizedArrayItemType, type Language} from '../types'

/**
 * Default filter function for the internationalized array field.
 * It filter the field base on the `language` value of the object.
 */
export const internationalizedArrayLanguageFilter = (
  enclosingType: ObjectSchemaType,
  _member: FieldMember | FieldsetState,
  selectedLanguageIds: string[],
  parentValue: Record<string, unknown> | undefined,
  languages: Language[],
) => {
  if (isInternationalizedArrayItemType(enclosingType.name)) {
    const language =
      typeof parentValue?.[LANGUAGE_FIELD_NAME] === 'string'
        ? parentValue?.[LANGUAGE_FIELD_NAME]
        : typeof parentValue?.['_key'] === 'string'
          ? parentValue?.['_key']
          : null

    const isAValidLanguage = language ? languages.find((l) => l.id === language) : true
    if (!isAValidLanguage) {
      // If it's not a valid language we should not hide it, because it needs to be surfaced to the user to fix it.
      // We need to update language-filter plugin so it doesn't hide the field later.
      return true
    }
    return language ? selectedLanguageIds.includes(language) : false
  }
  return true
}
