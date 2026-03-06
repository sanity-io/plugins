const toFieldLanguagesKeyPrefix = 'sanityStudio:assist:field-languages:from:'

export function getPreferredToFieldLanguages(fromLanguageId: string): string[] {
  if (typeof localStorage === 'undefined') {
    return []
  }

  const value = localStorage.getItem(`${toFieldLanguagesKeyPrefix}${fromLanguageId}`)
  if (!value) return []
  try {
    // oxlint-disable-next-line no-unsafe-type-assertion
    return JSON.parse(value) as string[]
  } catch {
    return []
  }
}

export function setPreferredToFieldLanguages(fromLanguageId: string, languageIds: string[]) {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(`${toFieldLanguagesKeyPrefix}${fromLanguageId}`, JSON.stringify(languageIds))
}
