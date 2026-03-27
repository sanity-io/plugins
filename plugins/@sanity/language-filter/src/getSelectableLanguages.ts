import type {Language} from './types'

export function getSelectableLanguages({
  supportedLanguages,
  defaultLanguages,
}: {
  supportedLanguages: Language[]
  defaultLanguages?: string[]
}): Language[] {
  return supportedLanguages.filter((lang) => !defaultLanguages?.includes(lang.id))
}
