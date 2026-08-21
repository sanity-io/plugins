import {AddIcon} from '@sanity/icons/Add'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Button, Card, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import type React from 'react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
import {documentExistsInStore, documentMissingFromStore} from '../utils/documentExistsInStore'
import {internationalizedArrayLanguageFilter} from '../utils/internationalizedArrayLanguageFilter'
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
 *   `defaultLanguages` when those entries are missing. Only runs while the
 *   document pair store still has a draft/published/version snapshot, so the
 *   effect never recreates a just-deleted document or creates a draft before
 *   the user's first edit. Form `_rev` is not used for this check — it can
 *   linger on the last displayed snapshot after delete, and Studio's Delete
 *   action does not set `useDocumentPane().isDeleting`.
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
  const readOnly = Boolean(documentReadOnly) || schemaType.readOnly === true
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

  const {isDeleted, isDeleting, editState} = useDocumentPane()

  // Pair-store snapshots are the existence check. Patching a document that is
  // no longer in the store recreates it as an empty draft. Form `_rev` can
  // linger on the last displayed snapshot after delete, and the built-in Delete
  // action never writes pane `isDeleting`, so neither of those is sufficient.
  const documentInStore = documentExistsInStore(editState)
  const documentGoneFromStore = documentMissingFromStore(editState)

  // Latch once this pane instance has observed the document leave the store, or
  // once its language items disappear after being present. Either means delete
  // (or equivalent) is in flight; auto-adding would resurrect the document.
  // Only a confirmed absence (ready store, no snapshots) latches — loading
  // emissions are transient and merely pause auto-patches via
  // `documentInStore`. Adjusted during render (not in an effect) so the skip
  // is applied on the same commit that observes the transition.
  const [seenInStore, setSeenInStore] = useState(documentInStore)
  const [leftStore, setLeftStore] = useState(false)
  if (documentInStore && !seenInStore) {
    setSeenInStore(true)
  }
  if (documentGoneFromStore && seenInStore && !leftStore) {
    setLeftStore(true)
  }

  const [hadItems, setHadItems] = useState(() => Boolean(value?.length))
  if (value?.length && !hadItems) {
    setHadItems(true)
  }

  const itemsDisappeared = hadItems && !value?.length

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

  const canAutoAddDefaults =
    documentInStore &&
    !leftStore &&
    !itemsDisappeared &&
    !isDeleting &&
    !isDeleted &&
    !readOnly &&
    !shouldMigrateArray

  const canAutoAddDefaultsRef = useRef(canAutoAddDefaults)
  useEffect(() => {
    canAutoAddDefaultsRef.current = canAutoAddDefaults
  })

  useEffect(() => {
    const hasAddedDefaultLanguages = defaultLanguages
      .filter((language) => languages.find((l) => l.id === language))
      .every((language) => addedLanguages.includes(language))

    if (!canAutoAddDefaults || hasAddedDefaultLanguages) {
      return undefined
    }

    const languagesToAdd = defaultLanguages
      .filter((language) => !addedLanguages.includes(language))
      .filter((language) => languages.find((l) => l.id === language))

    if (languagesToAdd.length === 0) {
      return undefined
    }

    // Account for strict mode by scheduling the update. Re-check the ref
    // inside the timeout so a delete that lands before the macrotask cannot
    // still emit setIfMissing and recreate the document.
    const timeout = setTimeout(() => {
      if (!canAutoAddDefaultsRef.current) return
      handleAddLanguages(languagesToAdd)
    })
    return () => clearTimeout(timeout)
  }, [canAutoAddDefaults, handleAddLanguages, defaultLanguages, addedLanguages, languages])

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

  // Automatically restore order of fields (opt out with restoreOrder: false)
  useEffect(() => {
    if (
      restoreOrder &&
      languagesOutOfOrder.length > 0 &&
      allKeysAreLanguages &&
      !readOnly &&
      canAutoAddDefaults
    ) {
      handleRestoreOrder()
    }
  }, [
    restoreOrder,
    languagesOutOfOrder,
    allKeysAreLanguages,
    handleRestoreOrder,
    readOnly,
    canAutoAddDefaults,
  ])

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
    !shouldMigrateArray &&
    // Plugin was configured to display buttons here (default!)
    buttonLocations.includes('field') &&
    // There's at least one language visible
    filteredLanguages?.length > 0 &&
    // Not every language has a value yet
    !allLanguagesArePresent
  const fieldHasMembers = members?.length > 0
  const addAllTitle = createAddAllTitle(value, filteredLanguages)

  return (
    <Stack gap={2}>
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

      {addButtonsAreVisible ? (
        <Stack gap={2}>
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
