import {defineField, type FieldDefinition, type Rule} from 'sanity'

import type {Language, LanguageCallback, InternationalizedArrayItem} from '../types'

import {getFunctionCache, peek, setFunctionCache} from '../cache'
import {createFieldName} from '../components/createFieldName'
import {getSelectedValue} from '../components/getSelectedValue'
import InternationalizedArray from '../components/InternationalizedArray'
import {LANGUAGE_FIELD_NAME} from '../constants'
import {getLanguagesFieldOption} from '../utils/getLanguagesFieldOption'

type ArrayFactoryConfig = {
  apiVersion: string
  select?: Record<string, string>
  languages: Language[] | LanguageCallback
  defaultLanguages?: string[]
  type: string | FieldDefinition
}

export type ArrayFieldOptions = Pick<ArrayFactoryConfig, 'apiVersion' | 'select' | 'languages'>

export default (config: ArrayFactoryConfig) => {
  const {apiVersion, select, languages, type} = config
  const typeName = typeof type === `string` ? type : type.name
  const arrayName = createFieldName(typeName)
  const objectName = createFieldName(typeName, true)

  return defineField({
    name: arrayName,
    title: 'Internationalized array',
    type: 'array',
    components: {
      input: InternationalizedArray,
    },
    options: {
      // @ts-expect-error - these options are required for validation rules – not the custom input component
      apiVersion,
      select,
      languages,
    },
    of: [
      defineField({
        ...(typeof type === 'string' ? {} : type),
        name: objectName,
        type: objectName,
      }),
    ],
    // @ts-expect-error - fix typings
    validation: (rule: Rule) =>
      rule.custom<InternationalizedArrayItem[]>(async (value, context) => {
        if (!value || value.length === 0) {
          return true
        }

        // Check for items missing the language field (unmigrated data)
        const itemsMissingLanguage = value.filter(
          (item) => item && !item[LANGUAGE_FIELD_NAME] && item._key,
        )
        if (itemsMissingLanguage.length > 0) {
          return {
            message:
              'Language is required for each array item. Run the migration to update your data from the old format.',
            paths: itemsMissingLanguage.flatMap((item) => [
              [{_key: item._key}],
              [{_key: item._key}, 'value'],
            ]),
          }
        }

        // Early return for simple cases to avoid expensive operations
        if (value.length === 1 && !value[0]?.[LANGUAGE_FIELD_NAME]) {
          return true
        }

        const selectedValue = getSelectedValue(select, context.document)
        const client = context.getClient({apiVersion})

        let contextLanguages: Language[] = []
        const languagesFieldOption = getLanguagesFieldOption(context?.type)

        if (Array.isArray(languagesFieldOption)) {
          contextLanguages = languagesFieldOption
        } else if (Array.isArray(peek(selectedValue))) {
          contextLanguages = peek(selectedValue) || []
        } else if (typeof languagesFieldOption === 'function') {
          // Try to get from function cache first (if it's the same function as the component)
          const cachedLanguages = getFunctionCache(languagesFieldOption, selectedValue)

          if (Array.isArray(cachedLanguages)) {
            contextLanguages = cachedLanguages
          } else {
            // Try suspend cache as fallback
            const suspendCachedLanguages = peek(selectedValue)
            if (Array.isArray(suspendCachedLanguages)) {
              contextLanguages = suspendCachedLanguages
            } else {
              // Only make the async call if we don't have cached data
              contextLanguages = await languagesFieldOption(client, selectedValue)
              // Cache the result for future validation calls
              setFunctionCache(languagesFieldOption, selectedValue, contextLanguages)
            }
          }
        }

        if (value && value.length > contextLanguages.length) {
          return `Cannot be more than ${
            contextLanguages.length === 1 ? `1 item` : `${contextLanguages.length} items`
          }`
        }

        // Create a Set for faster language ID lookups
        const languageIds = new Set(contextLanguages.map((lang) => lang.id))

        // Check for invalid language keys
        const nonLanguageKeys = value.filter(
          (item) => item?.[LANGUAGE_FIELD_NAME] && !languageIds.has(item[LANGUAGE_FIELD_NAME]),
        )
        if (nonLanguageKeys.length) {
          return {
            message: `Array item keys must be valid languages registered to the field type`,
            paths: nonLanguageKeys.map((item) => [{_key: item._key}]),
          }
        }

        // Check for duplicate language keys (more efficient)
        const seenLanguages = new Set<string>()
        const duplicateValues: InternationalizedArrayItem[] = []

        for (const item of value) {
          if (item?.[LANGUAGE_FIELD_NAME]) {
            if (seenLanguages.has(item[LANGUAGE_FIELD_NAME])) {
              duplicateValues.push(item)
            } else {
              seenLanguages.add(item[LANGUAGE_FIELD_NAME])
            }
          }
        }

        if (duplicateValues.length) {
          return {
            message: 'There can only be one field per language',
            paths: duplicateValues.map((item) => [{_key: item._key}]),
          }
        }

        return true
      }),
  })
}
