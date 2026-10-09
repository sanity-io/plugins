import {type FormPatch, set, setIfMissing, unset} from 'sanity'

import {PATH_CODE} from './config'

const PATH_LANGUAGE = ['language']

/**
 * Patches for a code editor change.
 *
 * `selectedLanguage` is the language the control is showing: the stored value,
 * `options.language`, or plain text when neither is set.
 *
 * Studio prepends its own `setIfMissing({_type})` before these patches. A
 * language nested inside another `setIfMissing` is then ignored, because the
 * object already exists. Set the language on its own when it is not stored yet.
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
}): FormPatch[] {
  const patches: FormPatch[] = [setIfMissing({_type: typeName})]

  if (storedLanguage === undefined && selectedLanguage) {
    patches.push(set(selectedLanguage, PATH_LANGUAGE))
  }

  patches.push(code ? set(code, PATH_CODE) : unset(PATH_CODE))
  return patches
}
