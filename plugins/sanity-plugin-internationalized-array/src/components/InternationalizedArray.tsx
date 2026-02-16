import type React from 'react'

import {AddIcon} from '@sanity/icons'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Button, Card, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo} from 'react'
import {
  type ArrayOfObjectsInputProps,
  ArrayOfObjectsItem,
  MemberItemError,
  set,
  setIfMissing,
  useFormValue,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import type {InternationalizedArrayItem} from '../types'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'
import AddButtons from './AddButtons'
import Feedback from './Feedback'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

/**
 * Main array input component for internationalized array fields.
 *
 * Replaces the default Sanity array input and manages the full lifecycle of
 * language entries:
 *
 * - **Language filter integration**: When `@sanity/language-filter` is active
 *   for the current document type, array members are filtered to only show
 *   languages matching the user's selection.
 * - **Adding languages**: Exposes per-language buttons and an "Add all / Add
 *   missing languages" button (controlled by `buttonAddAll` and
 *   `buttonLocations` config). Dispatches `setIfMissing` + `insert` patches.
 * - **Default languages**: Automatically adds entries for languages listed in
 *   `defaultLanguages` when a document is first created or when those entries
 *   are missing.
 * - **Ordering**: Detects when value items are out of order relative to the
 *   master `languages` list and automatically re-sorts them.
 * - **Validation**: Shows a `<Feedback>` component if the languages
 *   configuration is invalid (e.g. missing `id` or `title`).
 * - **Empty state**: Displays a "no translations" message when the field has
 *   no entries and the add buttons are not visible.
 */
export default function InternationalizedArray(
  props: ArrayOfObjectsInputProps,
): React.ReactElement {
  const {members, value: _value, schemaType, onChange, readOnly: documentReadOnly} = props
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const value = _value as InternationalizedArrayItem[]
  const readOnly = typeof schemaType.readOnly === 'boolean' ? schemaType.readOnly : false
  const toast = useToast()

  const {languages, filteredLanguages, defaultLanguages, buttonAddAll, buttonLocations} =
    useInternationalizedArrayContext()

  // Support updating the UI if languageFilter is installed
  const {selectedLanguageIds, options: languageFilterOptions} = useLanguageFilterStudioContext()
  const documentType = useFormValue(['_type'])
  const languageFilterEnabled =
    typeof documentType === 'string' && languageFilterOptions.documentTypes.includes(documentType)

  const filteredMembers = useMemo(
    () =>
      languageFilterEnabled
        ? members.filter((member) => {
            // This member is the outer object created by the plugin
            // Satisfy TS
            if (member.kind !== 'item') {
              return false
            }

            // This is the inner "value" field member created by this plugin
            const valueMember = member.item.members[0]

            // Satisfy TS
            if (!valueMember || valueMember.kind !== 'field') {
              return false
            }

            return languageFilterOptions.filterField(
              member.item.schemaType,
              valueMember,
              selectedLanguageIds,
            )
          })
        : members,
    [languageFilterEnabled, members, languageFilterOptions, selectedLanguageIds],
  )

  const handleAddLanguage = useCallback(
    (addLanguageKeys: string[] | string) => {
      if (!filteredLanguages?.length) {
        return
      }

      const patches = createAddLanguagePatches({
        addLanguageKeys: Array.isArray(addLanguageKeys) ? addLanguageKeys : [addLanguageKeys],
        schemaTypeName: schemaType.name,
        languages,
        filteredLanguages,
        value,
      })

      onChange([setIfMissing([]), ...patches])
    },
    [filteredLanguages, languages, onChange, schemaType, value],
  )

  const {isDeleting} = useDocumentPane()

  const addedLanguages = useMemo(() => {
    if (!value?.length) return []
    return value.map((v) => v[LANGUAGE_FIELD_NAME] ?? v._key).filter(Boolean)
  }, [value])
  const hasAddedDefaultLanguages = defaultLanguages
    .filter((language) => languages.find((l) => l.id === language))
    .every((language) => addedLanguages.includes(language))

  useEffect(() => {
    if (!isDeleting && !hasAddedDefaultLanguages) {
      const languagesToAdd = defaultLanguages
        .filter((language) => !addedLanguages.includes(language))
        .filter((language) => languages.find((l) => l.id === language))
      // Account for strict mode by scheduling the update
      const timeout = setTimeout(() => {
        if (!documentReadOnly) handleAddLanguage(languagesToAdd)
      })
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [
    isDeleting,
    hasAddedDefaultLanguages,
    handleAddLanguage,
    defaultLanguages,
    addedLanguages,
    languages,
    documentReadOnly,
  ])

  // NOTE: This is reordering and re-setting the whole array, it could be surgical
  const handleRestoreOrder = useCallback(() => {
    if (!value?.length || !languages?.length) {
      return
    }

    // Create a new value array in the correct order
    // This would also strip out values that don't have a language as the key
    const updatedValue = value
      .reduce((acc, v) => {
        const newIndex = languages.findIndex((l) => l.id === v?.[LANGUAGE_FIELD_NAME])

        if (newIndex > -1) {
          acc[newIndex] = v
        }

        return acc
      }, [] as InternationalizedArrayItem[])
      .filter(Boolean)

    if (value?.length !== updatedValue.length) {
      toast.push({
        title: 'There was an error reordering languages',
        status: 'warning',
      })
    }

    onChange(set(updatedValue))
  }, [toast, languages, onChange, value])

  const allKeysAreLanguages = useMemo(() => {
    if (!value?.length || !languages?.length) {
      return true
    }

    return value?.every((v) => languages.find((l) => l?.id === v?.[LANGUAGE_FIELD_NAME]))
  }, [value, languages])

  // Check languages are in the correct order
  const languagesInUse = useMemo(
    () =>
      languages && languages.length > 1
        ? languages.filter((l) => value?.find((v) => v[LANGUAGE_FIELD_NAME] === l.id))
        : [],
    [languages, value],
  )

  const languagesOutOfOrder = useMemo(() => {
    if (!value?.length || !languagesInUse.length) {
      return []
    }

    return value
      .map((v, vIndex) =>
        vIndex === languagesInUse.findIndex((l) => l.id === v[LANGUAGE_FIELD_NAME]) ? null : v,
      )
      .filter(Boolean)
  }, [value, languagesInUse])

  const languagesAreValid = useMemo(
    () =>
      !languages?.length || (languages?.length && languages.every((item) => item.id && item.title)),
    [languages],
  )

  // Automatically restore order of fields
  useEffect(() => {
    if (languagesOutOfOrder.length > 0 && allKeysAreLanguages && !documentReadOnly) {
      handleRestoreOrder()
    }
  }, [languagesOutOfOrder, allKeysAreLanguages, handleRestoreOrder, documentReadOnly])

  // compare value keys with possible languages
  const allLanguagesArePresent = useMemo(
    () => checkAllLanguagesArePresent(filteredLanguages, value),
    [filteredLanguages, value],
  )

  if (!languagesAreValid) {
    return <Feedback />
  }

  const addButtonsAreVisible =
    // Plugin was configured to display buttons here (default!)
    buttonLocations.includes('field') &&
    // There's at least one language visible
    filteredLanguages?.length > 0 &&
    // Not every language has a value yet
    !allLanguagesArePresent
  const fieldHasMembers = members?.length > 0

  return (
    <Stack space={2}>
      {fieldHasMembers ? (
        <>
          {filteredMembers.map((member) => {
            if (member.kind === 'item') {
              return <ArrayOfObjectsItem {...props} key={member.key} member={member} />
            }

            return <MemberItemError key={member.key} member={member} />
          })}
        </>
      ) : null}

      {/* Give some feedback in the UI so the field doesn't look "missing" */}
      {!addButtonsAreVisible && !fieldHasMembers ? (
        <Card border tone="transparent" padding={3} radius={2}>
          <Text size={1}>This internationalized field currently has no translations.</Text>
        </Card>
      ) : null}

      {addButtonsAreVisible ? (
        <Stack space={2}>
          <AddButtons
            languages={filteredLanguages}
            value={value}
            readOnly={readOnly}
            handleClick={handleAddLanguage}
          />
          {buttonAddAll ? (
            <Button
              tone="primary"
              mode="ghost"
              data-testid="add-all-languages"
              disabled={readOnly || allLanguagesArePresent}
              icon={AddIcon}
              text={createAddAllTitle(value, filteredLanguages)}
              onClick={() => handleAddLanguage(filteredLanguages.map((language) => language.id))}
            />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  )
}
