import {set, setIfMissing, unset} from 'sanity'

import {PATH_CODE} from './config'

/**
 * Patches for a code editor change.
 *
 * `selectedLanguage` is the language the control is showing: the stored value,
 * `options.language`, or plain text when neither is set.
 */
export function codeChangePatches({
  code,
  typeName,
  storedLanguage,
  selectedLanguage,
}: {
  code: string
  typeName: string
  storedLanguage: string | undefined
  selectedLanguage: string
}) {
  return [
    setIfMissing({
      _type: typeName,
      language: storedLanguage === undefined ? selectedLanguage : undefined,
    }),
    code ? set(code, PATH_CODE) : unset(PATH_CODE),
  ]
}
