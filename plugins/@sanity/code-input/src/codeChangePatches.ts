import {type FormPatch, set, setIfMissing, unset} from 'sanity'

import {PATH_CODE} from './config'

const PATH_LANGUAGE = ['language']

/**
 * Patches for a code editor change.
 *
 * `selectedLanguage` is the language the control is showing: the stored value,
 * `options.language`, or plain text when neither is set.
 *
 * Studio prepends `setIfMissing({_type})` before these patches, so a language
 * nested inside that object is ignored once the object exists. A field-level
 * `setIfMissing` still fills `language` when it is absent, and leaves a value
 * already present when the patch is applied.
 */
export function codeChangePatches({
  code,
  typeName,
  selectedLanguage,
}: {
  code: string
  typeName: string
  selectedLanguage: string
}): FormPatch[] {
  const patches: FormPatch[] = [setIfMissing({_type: typeName})]

  if (selectedLanguage) {
    patches.push(setIfMissing(selectedLanguage, PATH_LANGUAGE))
  }

  patches.push(code ? set(code, PATH_CODE) : unset(PATH_CODE))
  return patches
}
