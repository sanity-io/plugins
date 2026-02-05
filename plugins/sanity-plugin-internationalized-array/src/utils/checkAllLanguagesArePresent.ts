import type {Language, Value} from '../types'

import {LANGUAGE_FIELD_NAME} from '../constants'

export function checkAllLanguagesArePresent(
  languages: Language[],
  value: Value[] | undefined,
): boolean {
  const filteredLanguageIds = languages.map((l) => l.id)
  const languagesInUseIds = value ? value.map((v) => v[LANGUAGE_FIELD_NAME]) : []

  return (
    languagesInUseIds.length === filteredLanguageIds.length &&
    languagesInUseIds.every((l) => filteredLanguageIds.includes(l))
  )
}
