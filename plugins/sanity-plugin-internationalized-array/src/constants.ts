import type {PluginConfig} from './types'

/**
 * The field name used to identify the language of an internationalized array item.
 *
 * In v4.x this was '_key', in v5+ this is 'language'.
 * Having this as a constant makes the codebase easier to maintain.
 */
export const LANGUAGE_FIELD_NAME = 'language' as const

export const MAX_COLUMNS = {
  codeOnly: 5,
  titleOnly: 4,
  titleAndCode: 3,
}

export const CONFIG_DEFAULT: Required<PluginConfig> = {
  languages: [],
  select: {},
  defaultLanguages: [],
  fieldTypes: [],
  apiVersion: '2025-10-15',
  buttonLocations: ['field'],
  buttonAddAll: true,
  languageDisplay: 'codeOnly',
}
