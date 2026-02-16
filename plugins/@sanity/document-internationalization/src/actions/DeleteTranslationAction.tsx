import {TrashIcon} from '@sanity/icons'
import {type ButtonTone, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useClient, type DocumentActionDescription, type DocumentActionProps} from 'sanity'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'

import DeleteTranslationDialog from '../components/DeleteTranslationDialog'
import DeleteTranslationFooter from '../components/DeleteTranslationFooter'
import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'
import {API_VERSION, TRANSLATIONS_ARRAY_NAME} from '../constants'
import {type MetadataDocument} from '../types'

type DeleteOperation = 'DELETE' | 'UNSET'

/**
 * Optional Document action that removes a single translation from the metadata document
 * and optionally deletes the translation document. Opens a confirmation dialog
 * showing which metadata entries reference the document and any other references
 * that may exist. When the document has translation references, those references
 * are unset; otherwise the document is deleted directly.
 *
 * To use it, you need to add it to the document actions config
 * ```
 *  const translatedSchemaTypes = ['lesson', 'article'];
 * document: {
 *   actions: (prev, {schemaType}) => {
 *     if (translatedSchemaTypes.includes(schemaType)) {
 *       return [...prev, useDeleteTranslationAction]
 *     }
 *     return prev
 *   },
 * },
 * ```
 */
export const useDeleteTranslationAction = (
  props: DocumentActionProps,
): DocumentActionDescription => {
  const {id: documentId, published, draft} = props
  const doc = draft || published
  const {languageField} = useDocumentInternationalizationContext()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [translations, setTranslations] = useState<MetadataDocument[]>([])
  const onClose = useCallback(() => setDialogOpen(false), [])
  const rawDocumentLanguage = doc ? doc[languageField] : null
  const documentLanguage = typeof rawDocumentLanguage === 'string' ? rawDocumentLanguage : null

  const toast = useToast()
  const client = useClient({apiVersion: API_VERSION})
  // Remove translation reference and delete document in one transaction
  const onProceed = useCallback(() => {
    const tx = client.transaction()
    let operation: DeleteOperation = 'DELETE'

    if (documentLanguage && translations.length > 0) {
      operation = 'UNSET'
      translations.forEach((translation) => {
        tx.patch(translation._id, (patch) =>
          patch.unset([
            `${TRANSLATIONS_ARRAY_NAME}[${LANGUAGE_FIELD_NAME} == "${documentLanguage}"]`,
          ]),
        )
      })
    } else {
      tx.delete(documentId)
      tx.delete(`drafts.${documentId}`)
    }

    tx.commit()
      .then(() => {
        if (operation === 'DELETE') {
          onClose()
        }
        toast.push({
          status: 'success',
          title: operation === 'UNSET' ? 'Translation reference unset' : 'Document deleted',
          description: operation === 'UNSET' ? 'The document can now be deleted' : null,
        })
        return undefined
      })
      .catch((err: Error) => {
        toast.push({
          status: 'error',
          title:
            operation === 'UNSET'
              ? 'Failed to unset translation reference'
              : 'Failed to delete document',
          description: err.message,
        })
      })
  }, [client, documentLanguage, translations, documentId, onClose, toast])

  return {
    label: `Delete translation...`,
    disabled: !doc || !documentLanguage,
    icon: TrashIcon,
    tone: 'critical' as ButtonTone,
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: isDialogOpen && {
      type: 'dialog',
      onClose,
      header: 'Delete translation',
      content: doc ? (
        <DeleteTranslationDialog
          doc={doc}
          documentId={documentId}
          setTranslations={setTranslations}
        />
      ) : null,
      footer: (
        <DeleteTranslationFooter
          onClose={onClose}
          onProceed={onProceed}
          translations={translations}
        />
      ),
    },
  }
}

useDeleteTranslationAction.action = 'deleteTranslation'
useDeleteTranslationAction.displayName = 'DeleteTranslationAction'

/**
 * @deprecated use useDeleteTranslationAction instead
 * Will be removed in the next major version
 */
export const DeleteTranslationAction = (props: DocumentActionProps): DocumentActionDescription => {
  return useDeleteTranslationAction(props)
}
