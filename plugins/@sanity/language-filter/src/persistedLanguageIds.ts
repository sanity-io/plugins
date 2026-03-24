import {getSelectableLanguages} from './getSelectableLanguages'
import type {Language} from './types'

const storageKey = '@sanity/plugin/language-filter/selected-languages'

export function getPersistedLanguageIds(options: {
  supportedLanguages: Language[]
  defaultLanguages?: string[]
}): string[] {
  const selectableLangs = getSelectableLanguages(options).map((l) => l.id)
  let selected: string[] = selectableLangs
  try {
    const persistedValue = window.localStorage.getItem(storageKey)
    if (persistedValue) {
      const parsed = JSON.parse(persistedValue)
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        selected = parsed
      }
    }
  } catch {}

  // constrain persisted/selected languages to the ones currently supported
  selected = intersection(selected, selectableLangs)

  const supportedLanguageIds = options.supportedLanguages.map((language) => language.id)
  const defaultLanguageIds = intersection(options.defaultLanguages ?? [], supportedLanguageIds)
  return unique([...defaultLanguageIds, ...selected])
}

export function setPersistedLanguageIds(languageIds: string[]): void {
  window.localStorage.setItem(storageKey, JSON.stringify(languageIds))
}

function intersection(array1: string[], array2: string[]) {
  return array1.filter((value) => array2.includes(value))
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}
