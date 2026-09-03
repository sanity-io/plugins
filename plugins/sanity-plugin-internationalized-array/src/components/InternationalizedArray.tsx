import {AddIcon} from '@sanity/icons/Add'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Button, Card, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import type React from 'react'
import {useCallback, useContext, useEffect, useMemo} from 'react'
import {
  type ArrayOfObjectsInputProps,
  ArrayOfObjectsItem,
  MemberItemError,
  set,
  setIfMissing,
  useFormValue,
  useGetFormValue,
} from 'sanity'
import {EventsContext} from 'sanity/_singletons'
import {useDocumentPane} from 'sanity/structure'

import {LANGUAGE_FIELD_NAME} from '../constants'
import type {InternationalizedArrayItem} from '../types'
import {checkAllLanguagesArePresent} from '../utils/checkAllLanguagesArePresent'
import {createAddAllTitle} from '../utils/createAddAllTitle'
import {createAddLanguagePatches} from '../utils/createAddLanguagePatches'
import {internationalizedArrayLanguageFilter} from '../utils/internationalizedArrayLanguageFilter'
import AddButtons from './AddButtons'
import CompactAddButton from './CompactAddButton'
import Feedback from './Feedback'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'
import {MigrationBanner} from './MigrationBanner'

/**
 * The events store has finished loading and recorded no history. That is a
 * brand-new document.
 *
 * `sanity/_singletons` is internal; this is the same context `useEvents()`
 * reads. Using the context directly avoids throwing when the events API is
 * off (legacy timeline has no `EventsProvider`).
 */
function isPristineDocument(
  events: {events: readonly unknown[]; loading: boolean} | null,
): boolean {
  if (!events || events.loading) {
    return false
  }
  return events.events.length === 0
}

/**
 * Main array input component for internationalized array fields.
 *
 * Replaces the default Sanity array input and manages the full lifecycle of
 * language entries:
 *
 * - **Language filter integration**: When `@sanity/language-filter` is active
 *   for the current document type, array members are filtered to only show
 *   languages matching the user's selection.
 * - **Adding languages**: Exposes per-language buttons, an optional compact
 *   `fieldMenu`, and an "Add all / Add missing languages" button (controlled
 *   by `buttonAddAll` and `buttonLocations`). Dispatches `setIfMissing` +
 *   `insert` patches.
 * - **Default languages**: Automatically adds entries for languages listed in
 *   `defaultLanguages` when those entries are missing. Seeds brand-new
 *   documents once the events store reports they are pristine (no history),
 *   and seeds persisted documents that already have a `_rev`. A document
 *   that existed and was deleted is not pristine, so opening it — even in a
 *   fresh pane — does not recreate it. Newly created documents stay
 *   read-only until initial value templates resolve, and the field-level
 *   `readOnly` prop can lag that document-level lock. Skipping the patch
 *   until writable avoids "Attempted to patch a read-only document" toasts.
 * - **Ordering**: When `restoreOrder` is enabled (default), detects when value
 *   items are out of order relative to the master `languages` list and
 *   automatically re-sorts them. Set `restoreOrder: false` to keep the stored
 *   order and avoid silent draft creation on open.
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
  const itemsNeedingMigration = value?.filter((v) => !v[LANGUAGE_FIELD_NAME]) ?? []
  const shouldMigrateArray = itemsNeedingMigration.length > 0
  const toast = useToast()

  const getFormValue = useGetFormValue()
  const {
    languages,
    filteredLanguages,
    defaultLanguages,
    buttonAddAll,
    buttonLocations,
    restoreOrder,
    languageFilter: builtInLanguageFilter,
  } = useInternationalizedArrayContext()
  // Support updating the UI if languageFilter is installed
  const {selectedLanguageIds, options: languageFilterOptions} = useLanguageFilterStudioContext()
  const documentType = useFormValue(['_type'])
  const usingLanguageFilterPlugin =
    typeof documentType === 'string' && languageFilterOptions.documentTypes.includes(documentType)
  const usingBuiltInLanguageFilter =
    typeof documentType === 'string' && builtInLanguageFilter.documentTypes.includes(documentType)

  // TODO: Is this redundant? The filter plugin already filters members at its own level.
  const filteredMembers = useMemo(
    () =>
      usingLanguageFilterPlugin || usingBuiltInLanguageFilter
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
            // The built-in filter receives the full languages list so it can
            // surface fields with invalid language IDs rather than hiding them.
            // The language filter plugin does not support this.
            return usingBuiltInLanguageFilter
              ? internationalizedArrayLanguageFilter(
                  member.item.schemaType,
                  valueMember,
                  selectedLanguageIds,
                  member.item.value,
                  languages,
                )
              : languageFilterOptions.filterField(
                  member.item.schemaType,
                  valueMember,
                  selectedLanguageIds,
                  member.item.value,
                )
          })
        : members,
    [
      usingLanguageFilterPlugin,
      usingBuiltInLanguageFilter,
      members,
      selectedLanguageIds,
      languages,
      languageFilterOptions,
    ],
  )

  const {isDeleted, isDeleting, isInitialValueLoading, formState} = useDocumentPane()

  // Document-level locks (initial-value templates, permissions, history) are
  // not always reflected on the field's `readOnly` prop in the same tick as
  // the patch channel. Gating on both prevents toasts from auto-patches.
  const readOnly =
    Boolean(documentReadOnly) ||
    schemaType.readOnly === true ||
    Boolean(formState?.readOnly) ||
    Boolean(isInitialValueLoading)

  const handleAddLanguages = useCallback(
    (addLanguageKeys: string[] | string) => {
      if (readOnly) {
        return
      }
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
    [filteredLanguages, languages, onChange, schemaType, getFormValue, props.path, readOnly],
  )

  // `_rev` means the document is in the dataset. No `_rev` is either a
  // brand-new form or a deleted one. The events store distinguishes those:
  // pristine (loaded, zero events) has never existed; any history means it
  // did — including a fresh open of a deleted id, where this pane never saw
  // a `_rev`.
  const documentExists = Boolean(useFormValue(['_rev']))
  const isPristine = isPristineDocument(useContext(EventsContext))

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

    if (
      (isPristine || documentExists) &&
      !isDeleting &&
      !isDeleted &&
      !hasAddedDefaultLanguages &&
      !shouldMigrateArray &&
      !readOnly
    ) {
      const languagesToAdd = defaultLanguages
        .filter((language) => !addedLanguages.includes(language))
        .filter((language) => languages.find((l) => l.id === language))
      // Account for strict mode by scheduling the update.
      const timeout = setTimeout(() => {
        if (!readOnly) handleAddLanguages(languagesToAdd)
      })
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [
    isPristine,
    documentExists,
    isDeleted,
    isDeleting,
    handleAddLanguages,
    defaultLanguages,
    addedLanguages,
    languages,
    readOnly,
    shouldMigrateArray,
  ])

  // NOTE: This is reordering and re-setting the whole array, it could be surgical
  const handleRestoreOrder = useCallback(() => {
    if (readOnly || !value?.length || !languages?.length) {
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
  }, [toast, languages, onChange, value, readOnly])

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

  // Automatically restore order of fields (opt out with restoreOrder: false)
  useEffect(() => {
    if (restoreOrder && languagesOutOfOrder.length > 0 && allKeysAreLanguages && !readOnly) {
      handleRestoreOrder()
    }
  }, [restoreOrder, languagesOutOfOrder, allKeysAreLanguages, handleRestoreOrder, readOnly])

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

  const useFieldMenu = buttonLocations.includes('fieldMenu')
  const addButtonsAreVisible =
    !shouldMigrateArray &&
    filteredLanguages?.length > 0 &&
    ((buttonLocations.includes('field') && !allLanguagesArePresent) || useFieldMenu)
  const fieldHasMembers = members?.length > 0
  const addAllTitle = createAddAllTitle(value, filteredLanguages)

  const addButtons = addButtonsAreVisible ? (
    <Stack gap={2}>
      {useFieldMenu ? (
        <CompactAddButton
          languagesInUse={addedLanguages}
          readOnly={readOnly}
          handleClick={handleAddLanguages}
          onAddAll={addAllMissingLanguages}
          buttonAddAll={buttonAddAll}
        />
      ) : (
        <AddButtons
          languagesInUse={addedLanguages}
          readOnly={readOnly}
          handleClick={handleAddLanguages}
        />
      )}
      {buttonAddAll && !useFieldMenu ? (
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
  ) : null

  return (
    <Stack gap={2}>
      {useFieldMenu ? addButtons : null}
      {filteredMembers.map((member) => {
        if (member.kind === 'item') {
          return <ArrayOfObjectsItem {...props} key={member.key} member={member} />
        }
        return <MemberItemError key={member.key} member={member} />
      })}
      <MigrationBanner itemsNeedingMigration={itemsNeedingMigration} />

      {/* Give some feedback in the UI so the field doesn't look "missing" */}
      {!addButtonsAreVisible && !fieldHasMembers ? (
        <Card border tone="transparent" padding={3} radius={2}>
          <Text size={1}>This internationalized field currently has no translations.</Text>
        </Card>
      ) : null}

      {useFieldMenu ? null : addButtons}
    </Stack>
  )
}
