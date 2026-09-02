import {AddIcon} from '@sanity/icons/Add'
import {TranslateIcon} from '@sanity/icons/Translate'
import {useCallback} from 'react'
import {
  defineDocumentFieldAction,
  type DocumentFieldActionItem,
  type DocumentFieldActionProps,
  type Path,
  PatchEvent,
  setIfMissing,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useInternationalizedArrayContext} from '../components/InternationalizedArrayContext'
import {LANGUAGE_FIELD_NAME} from '../constants'
import type {Language, InternationalizedArrayItem} from '../types'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'

/**
 * Read `path` out of a document value. Field actions render outside the
 * `FormValueProvider` on Sanity 6, so `useFormValue` cannot be used there; the
 * pane's `formState.value` is the same document and is always available.
 */
function valueAtPath(doc: unknown, path: Path): unknown {
  let node: unknown = doc
  for (const seg of path || []) {
    if (node == null) return undefined
    if (typeof seg === 'string' || typeof seg === 'number') {
      node = (node as Record<string | number, unknown>)[seg]
    } else if (seg && typeof seg === 'object' && '_key' in seg && Array.isArray(node)) {
      node = node.find((item) => item && (item as {_key?: string})._key === seg._key)
    } else {
      return undefined
    }
  }
  return node
}

const createTranslateFieldActions: (
  fieldActionProps: DocumentFieldActionProps,
  context: {
    languages: Language[]
    filteredLanguages: Language[]
  },
) => DocumentFieldActionItem[] = (fieldActionProps, {languages, filteredLanguages}) =>
  languages.map((language) => {
    const {onChange, formState} = useDocumentPane()
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const value = valueAtPath(formState?.value, fieldActionProps.path) as InternationalizedArrayItem[]
    const disabled =
      Boolean(formState?.readOnly) ||
      (value && Array.isArray(value)
        ? Boolean(value?.find((item) => item[LANGUAGE_FIELD_NAME] === language.id))
        : false)
    const hidden = !filteredLanguages.some((f) => f.id === language.id)

    const onAction = useCallback(() => {
      const {schemaType, path} = fieldActionProps

      const addLanguageKeys = [language.id]
      const patches = createAddLanguagePatches({
        addLanguageKeys,
        schemaTypeName: schemaType.name,
        languages,
        filteredLanguages,
        value,
        path,
      })

      onChange(PatchEvent.from([setIfMissing([], path), ...patches]))
    }, [language.id, value, onChange])

    return {
      type: 'action',
      icon: AddIcon,
      onAction,
      title: language.title,
      hidden,
      disabled,
    }
  })

const AddMissingTranslationsFieldAction: (
  fieldActionProps: DocumentFieldActionProps,
  context: {
    languages: Language[]
    filteredLanguages: Language[]
  },
) => DocumentFieldActionItem = (fieldActionProps, {languages, filteredLanguages}) => {
  const {onChange, formState} = useDocumentPane()
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const value = valueAtPath(formState?.value, fieldActionProps.path) as InternationalizedArrayItem[]
  const disabled =
    Boolean(formState?.readOnly) || (value && value.length === filteredLanguages.length)
  const hidden = checkAllLanguagesArePresent(filteredLanguages, value)

  const onAction = useCallback(() => {
    const {schemaType, path} = fieldActionProps

    const addLanguageKeys: string[] = []
    const patches = createAddLanguagePatches({
      addLanguageKeys,
      schemaTypeName: schemaType.name,
      languages,
      filteredLanguages,
      value,
      path,
    })

    onChange(PatchEvent.from([setIfMissing([], path), ...patches]))
  }, [fieldActionProps, filteredLanguages, languages, onChange, value])

  return {
    type: 'action',
    icon: AddIcon,
    onAction,
    title: createAddAllTitle(value, filteredLanguages),
    disabled,
    hidden,
  }
}

export const internationalizedArrayFieldAction = defineDocumentFieldAction({
  name: 'internationalizedArray',
  useAction(fieldActionProps) {
    const isInternationalizedArrayField =
      fieldActionProps?.schemaType?.type?.name.startsWith('internationalizedArray')
    const {languages, filteredLanguages} = useInternationalizedArrayContext()

    const translateFieldActions = createTranslateFieldActions(fieldActionProps, {
      languages,
      filteredLanguages,
    })

    return {
      type: 'group',
      icon: TranslateIcon,
      title: 'Add Translation',
      renderAsButton: true,
      children: isInternationalizedArrayField
        ? [
            ...translateFieldActions,
            AddMissingTranslationsFieldAction(fieldActionProps, {
              languages,
              filteredLanguages,
            }),
          ]
        : [],
      hidden: !isInternationalizedArrayField,
    }
  },
})
