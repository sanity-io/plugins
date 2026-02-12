import {randomKey} from '@sanity/util/content'
import {type FormInsertPatch, insert, type Path} from 'sanity'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {
  type Language,
  type InternationalizedArrayItem,
  isInternationalizedArrayItemType,
} from '../types'

type AddConfig = {
  // New keys to add to the field
  addLanguageKeys: string[]
  // Schema of the current field
  schemaTypeName: string
  // All languages registered in the plugin
  languages: Language[]
  // Languages that are currently visible
  filteredLanguages: Language[]
  // Current value of the internationalizedArray field
  value?: InternationalizedArrayItem[]
  // Path to this item
  path?: Path
}

/**
 * Creates an array of Sanity `FormInsertPatch` objects that add new language
 * entries to an internationalized array field.
 *
 * If `addLanguageKeys` is provided, patches are created for those specific
 * language IDs. Otherwise, patches are created for all filtered languages
 * that are not already present in the current `value` array, for example when adding all missing languages.
 *
 * Each new item is assigned the correct `_type` (derived from the schema)
 * and the language identifier via `LANGUAGE_FIELD_NAME`.
 *
 * Insertions are ordered to maintain the same sequence as the master
 * `languages` list: each new item is inserted before the next existing
 * language in the value array, or appended at the end if no subsequent
 * language exists.
 */
export function createAddLanguagePatches(config: AddConfig): FormInsertPatch[] {
  const {addLanguageKeys, schemaTypeName, languages, filteredLanguages, value, path = []} = config

  const type = `${schemaTypeName}Value`
  if (!isInternationalizedArrayItemType(type)) {
    throw new Error(`Invalid internationalized array type: ${type}`)
  }
  const itemBase = {_type: type}

  // Create new items with random _key and language identifier
  const getNewItems = () => {
    if (Array.isArray(addLanguageKeys) && addLanguageKeys.length > 0) {
      return addLanguageKeys
        .filter((id) => {
          if (value?.length) {
            // Check if the language is already in the value and filter it out if it exists to avoid duplicates
            return !value.find((v) => v[LANGUAGE_FIELD_NAME] === id)
          }
          return true
        })
        .map((id) => Object.assign({}, itemBase, {_key: randomKey(), [LANGUAGE_FIELD_NAME]: id}))
    }

    return filteredLanguages
      .filter((language) => {
        return value?.length ? !value.find((v) => v[LANGUAGE_FIELD_NAME] === language.id) : true
      })
      .map((language) => Object.assign({}, itemBase, {_key: randomKey(), [LANGUAGE_FIELD_NAME]: language.id}))
  }
  const newItems = getNewItems()

  // Insert new items in the correct order
  const languagesInUse = value?.length ? value.map((v) => v) : []

  const insertions = newItems.map((item) => {
    // What's the original index of this language?
    const itemLanguage = item[LANGUAGE_FIELD_NAME]
    const languageIndex = languages.findIndex((l) => itemLanguage === l.id)

    // What languages are there beyond that index?
    const remainingLanguages = languages.slice(languageIndex + 1)

    // So what is the index in the current value array of the next language in the language array?
    const nextLanguageIndex = languagesInUse.findIndex((l) =>
      remainingLanguages.find((r) => r.id === l[LANGUAGE_FIELD_NAME]),
    )

    // Keep local state up to date incase multiple insertions are being made
    if (nextLanguageIndex < 0) {
      languagesInUse.push(item)
    } else {
      languagesInUse.splice(nextLanguageIndex, 0, item)
    }

    return nextLanguageIndex < 0
      ? // No next language (-1), add to end of array
        insert([item], 'after', [...path, nextLanguageIndex])
      : // Next language found, insert before that
        insert([item], 'before', [...path, nextLanguageIndex])
  })

  return insertions
}
