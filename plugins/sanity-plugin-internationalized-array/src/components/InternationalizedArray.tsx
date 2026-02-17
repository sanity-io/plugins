import {AddIcon} from '@sanity/icons'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Button, Card, Stack, Text, useToast} from '@sanity/ui'
import type React from 'react'
import {useCallback, useEffect, useMemo} from 'react'
import {
  type ArrayOfObjectsInputProps,
  ArrayOfObjectsItem,
  MemberItemError,
  set,
  setIfMissing,
  useFormValue,
  useGetFormValue,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {LANGUAGE_FIELD_NAME} from '../constants'
import type {InternationalizedArrayItem} from '../types'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'
import AddButtons from './AddButtons'
import Feedback from './Feedback'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'
import {MigrationBanner} from './MigrationBanner'

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
  const itemsNeedingMigration = (value?.filter((v) => !v[LANGUAGE_FIELD_NAME]) ?? []).length > 0
  const readOnly =
    Boolean(documentReadOnly) ||
    (typeof schemaType.readOnly === 'boolean' ? schemaType.readOnly : false)
  const toast = useToast()

  const getFormValue = useGetFormValue()
  const {languages, filteredLanguages, defaultLanguages, buttonAddAll, buttonLocations} =
    useInternationalizedArrayContext()

  // Support updating the UI if languageFilter is installed
  const {selectedLanguageIds, options: languageFilterOptions} = useLanguageFilterStudioContext()
  const documentType = useFormValue(['_type'])
  const languageFilterEnabled =
    typeof documentType === 'string' && languageFilterOptions.documentTypes.includes(documentType)

  // TODO:Is this redundant? The filter plugin is already filtering the members, why do we also need to call it at this level.
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
              value[member.index],
            )
          })
        : members,
    [languageFilterEnabled, members, languageFilterOptions, selectedLanguageIds, value],
  )

  const handleAddLanguages = useCallback(
    (addLanguageKeys: string[] | string) => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const formValue = getFormValue(props.path) as InternationalizedArrayItem[]
      if (!filteredLanguages?.length) {
        return
      }

      const patches = createAddLanguagePatches({
        addLanguageKeys: Array.isArray(addLanguageKeys) ? addLanguageKeys : [addLanguageKeys],
        schemaTypeName: schemaType.name,
        languages,
        filteredLanguages,
        value: formValue,
      })

      onChange([setIfMissing([]), ...patches])
    },
    [filteredLanguages, languages, onChange, schemaType, getFormValue, props.path],
  )

  const {isDeleting} = useDocumentPane()

  // Create a stable dependency string that only changes when language keys change
  const languageKeysFromValue = value
    ?.map((v) => v[LANGUAGE_FIELD_NAME] ?? v._key)
    .filter(Boolean)
    .join(',')

  const addedLanguages = useMemo(() => {
    const languageKeys = languageKeysFromValue?.split(',') || []
    if (!languageKeys?.length) return []
    if (!languages?.length) return []

    return languages.filter((l) => languageKeys?.find((key) => key === l.id)).map((l) => l.id)
  }, [languageKeysFromValue, languages])

  useEffect(() => {
    const hasAddedDefaultLanguages = defaultLanguages
      .filter((language) => languages.find((l) => l.id === language))
      .every((language) => addedLanguages.includes(language))

    if (!isDeleting && !hasAddedDefaultLanguages && !itemsNeedingMigration) {
      const languagesToAdd = defaultLanguages
        .filter((language) => !addedLanguages.includes(language))
        .filter((language) => languages.find((l) => l.id === language))
      // Account for strict mode by scheduling the update
      const timeout = setTimeout(() => {
        if (!documentReadOnly) handleAddLanguages(languagesToAdd)
      })
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [
    isDeleting,
    handleAddLanguages,
    defaultLanguages,
    addedLanguages,
    languages,
    documentReadOnly,
    itemsNeedingMigration,
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

  const languagesOutOfOrder = useMemo(() => {
    if (!value?.length || !addedLanguages.length) {
      return []
    }

    return value
      .map((v, vIndex) =>
        vIndex === addedLanguages.findIndex((language) => language === v[LANGUAGE_FIELD_NAME])
          ? null
          : v,
      )
      .filter(Boolean)
  }, [value, addedLanguages])

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
  const addAllMissingLanguages = useCallback(() => {
    handleAddLanguages(filteredLanguages.map((language) => language.id))
  }, [filteredLanguages, handleAddLanguages])

  if (!languagesAreValid) {
    return <Feedback />
  }

  const addButtonsAreVisible =
    !itemsNeedingMigration &&
    // Plugin was configured to display buttons here (default!)
    buttonLocations.includes('field') &&
    // There's at least one language visible
    filteredLanguages?.length > 0 &&
    // Not every language has a value yet
    !allLanguagesArePresent
  const fieldHasMembers = members?.length > 0
  const addAllTitle = createAddAllTitle(value, filteredLanguages)

  return (
    <Stack space={2}>
      {filteredMembers.map((member) => {
        if (member.kind === 'item') {
          return <ArrayOfObjectsItem {...props} key={member.key} member={member} />
        }
        return <MemberItemError key={member.key} member={member} />
      })}
      <MigrationBanner
        value={value}
        languages={languages}
        onChange={onChange}
        readOnly={readOnly}
      />

      {/* Give some feedback in the UI so the field doesn't look "missing" */}
      {!addButtonsAreVisible && !fieldHasMembers ? (
        <Card border tone="transparent" padding={3} radius={2}>
          <Text size={1}>This internationalized field currently has no translations.</Text>
        </Card>
      ) : null}

      {addButtonsAreVisible ? (
        <Stack space={2}>
          <AddButtons
            languagesInUse={addedLanguages}
            readOnly={readOnly}
            handleClick={handleAddLanguages}
          />
          {buttonAddAll ? (
            <Button
              tone="primary"
              mode="ghost"
              data-testid="add-all-languages"
              disabled={readOnly || allLanguagesArePresent}
              icon={AddIcon}
              text={addAllTitle}
              onClick={addAllMissingLanguages}
            />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  )
}
