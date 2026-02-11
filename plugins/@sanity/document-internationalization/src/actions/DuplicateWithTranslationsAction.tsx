import {CopyIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type DocumentActionComponent,
  type Id,
  InsufficientPermissionsMessage,
  type PatchOperations,
  useClient,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentStore,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {structureLocaleNamespace} from 'sanity/structure'

import {METADATA_SCHEMA_NAME, TRANSLATIONS_ARRAY_NAME} from '../constants'
import {useTranslationMetadata} from '../hooks/useLanguageMetadata'
import {documenti18nLocaleNamespace} from '../i18n'

// Types for document store operations
interface EditOperations {
  duplicate: {disabled: string | false; execute: (id: string) => void}
}

interface OperationSuccessEvent {
  op: string
  type: 'success' | 'error'
}

const DISABLED_REASON_KEY = {
  METADATA_NOT_FOUND: 'action.duplicate.disabled.missing-metadata',
  MULTIPLE_METADATA: 'action.duplicate.disabled.multiple-metadata',
  NOTHING_TO_DUPLICATE: 'action.duplicate.disabled.nothing-to-duplicate',
  NOT_READY: 'action.duplicate.disabled.not-ready',
}

/* oxlint-disable typescript-eslint/no-deprecated -- onComplete is needed for backwards compatibility */
export const DuplicateWithTranslationsAction: DocumentActionComponent = ({
  id,
  type,
  onComplete,
}) => {
  /* oxlint-enable typescript-eslint/no-deprecated */
  const documentStore = useDocumentStore()
  const {duplicate} = useDocumentOperation(id, type)
  const {navigateIntent} = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'duplicate',
  })
  const {data, loading: isMetadataDocumentLoading} = useTranslationMetadata(id)
  const hasOneMetadataDocument = useMemo(() => {
    return Array.isArray(data) && data.length <= 1
  }, [data])
  const metadataDocument = Array.isArray(data) && data.length ? data[0] : null
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {t: s} = useTranslation(structureLocaleNamespace)
  const {t: d} = useTranslation(documenti18nLocaleNamespace)
  const currentUser = useCurrentUser()

  const handle = useCallback(() => {
    setDuplicating(true)

    // Async function that does the actual work
    async function performDuplication(): Promise<void> {
      if (!metadataDocument) {
        return Promise.reject(new Error('Metadata document not found'))
      }

      // 1. Duplicate the document and its localized versions
      const translations = new Map<string, Id>()
      await Promise.all(
        metadataDocument[TRANSLATIONS_ARRAY_NAME].map(async (translation) => {
          const dupeId = uuid()
          const locale = translation._key
          const docId = translation.value?._ref

          if (!docId) {
            return Promise.reject(new Error('Translation document not found'))
          }

          const {duplicate: duplicateTranslation} = await firstValueFrom(
            documentStore.pair
              .editOperations(docId, type)
              .pipe(filter((op: EditOperations) => op.duplicate.disabled !== 'NOT_READY')),
          )

          if (duplicateTranslation.disabled) {
            return Promise.reject(new Error('Cannot duplicate document'))
          }

          const duplicateTranslationSuccess = firstValueFrom(
            documentStore.pair
              .operationEvents(docId, type)
              .pipe(
                filter((e: OperationSuccessEvent) => e.op === 'duplicate' && e.type === 'success'),
              ),
          )
          duplicateTranslation.execute(dupeId)
          await duplicateTranslationSuccess

          translations.set(locale, dupeId)
        }),
      )

      // 2. Duplicate the metadata document
      const {duplicate: duplicateMetadata} = await firstValueFrom(
        documentStore.pair
          .editOperations(metadataDocument._id, METADATA_SCHEMA_NAME)
          .pipe(filter((op: EditOperations) => op.duplicate.disabled !== 'NOT_READY')),
      )

      if (duplicateMetadata.disabled) {
        return Promise.reject(new Error('Cannot duplicate document'))
      }

      const duplicateMetadataSuccess = firstValueFrom(
        documentStore.pair
          .operationEvents(metadataDocument._id, METADATA_SCHEMA_NAME)
          .pipe(filter((e: OperationSuccessEvent) => e.op === 'duplicate' && e.type === 'success')),
      )
      const dupeId = uuid()
      duplicateMetadata.execute(dupeId)
      await duplicateMetadataSuccess

      // 3. Patch the duplicated metadata document to update the references
      const patch: PatchOperations = {
        set: Object.fromEntries(
          Array.from(translations.entries()).map(([locale, documentId]) => [
            `${TRANSLATIONS_ARRAY_NAME}[_key == "${locale}"].value._ref`,
            documentId,
          ]),
        ),
      }

      await client.transaction().patch(dupeId, patch).commit()

      // 4. Navigate to the duplicated document
      navigateIntent('edit', {
        id: Array.from(translations.values()).at(0),
        type,
      })

      onComplete()
    }

    // Execute and handle success/error
    performDuplication()
      .catch((error: unknown) => {
        console.error(error)
        toast.push({
          status: 'error',
          title: 'Error duplicating document',
          description: error instanceof Error ? error.message : 'Failed to duplicate document',
        })
      })
      .finally(() => {
        setDuplicating(false)
      })
  }, [client, documentStore.pair, metadataDocument, navigateIntent, onComplete, toast, type])

  return useMemo(() => {
    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        icon: CopyIcon,
        disabled: true,
        label: d('action.duplicate.label'),
        title: (
          <InsufficientPermissionsMessage context="duplicate-document" currentUser={currentUser} />
        ),
      }
    }

    if (!isMetadataDocumentLoading && !metadataDocument) {
      return {
        icon: CopyIcon,
        disabled: true,
        label: d('action.duplicate.label'),
        title: d(DISABLED_REASON_KEY.METADATA_NOT_FOUND),
      }
    }

    if (!hasOneMetadataDocument) {
      return {
        icon: CopyIcon,
        disabled: true,
        label: d('action.duplicate.label'),
        title: d(DISABLED_REASON_KEY.MULTIPLE_METADATA),
      }
    }

    return {
      icon: CopyIcon,
      disabled:
        isDuplicating ||
        Boolean(duplicate.disabled) ||
        isPermissionsLoading ||
        isMetadataDocumentLoading,
      label: isDuplicating ? s('action.duplicate.running.label') : d('action.duplicate.label'),
      title: duplicate.disabled ? s(DISABLED_REASON_KEY[duplicate.disabled]) : '',
      onHandle: handle,
    }
  }, [
    currentUser,
    duplicate.disabled,
    handle,
    hasOneMetadataDocument,
    isDuplicating,
    isMetadataDocumentLoading,
    isPermissionsLoading,
    metadataDocument,
    permissions?.granted,
    s,
    d,
  ])
}

DuplicateWithTranslationsAction.action = 'duplicate'
DuplicateWithTranslationsAction.displayName = 'DuplicateWithTranslationsAction'
