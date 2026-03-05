import {TranslateIcon} from '@sanity/icons'
import {Box, Spinner} from '@sanity/ui'
import {useMemo, useRef} from 'react'
import {
  type DocumentFieldAction,
  type DocumentFieldActionGroup,
  type DocumentFieldActionItem,
  type DocumentFieldActionProps,
  type ObjectSchemaType,
  useClient,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useDraftDelayedTask} from '../assistDocument/RequestRunInstructionProvider'
import {useAiAssistanceConfig} from '../assistLayout/AiAssistanceConfigContext'
import {isAssistSupported} from '../helpers/assistSupported'
import {getConditionalMembers} from '../helpers/conditionalMembers'
import {createStyleGuideResolver} from '../helpers/styleguide'
import type {AssistOptions} from '../schemas/typeDefExtensions'
import {API_VERSION_WITH_EXTENDED_TYPES, useApiClient, useTranslate} from '../useApiClient'
import {useFieldTranslation} from './FieldTranslationProvider'

function node(node: DocumentFieldActionItem | DocumentFieldActionGroup) {
  return node
}

export type TranslateProps = DocumentFieldActionProps & {
  documentIsAssistable?: boolean
  documentSchemaType?: ObjectSchemaType
}
export const translateActions: DocumentFieldAction = {
  name: 'sanity-assist-translate',
  useAction(props: TranslateProps) {
    const {config, status} = useAiAssistanceConfig()
    const apiClient = useApiClient(config?.__customApiClient)
    const client = useClient({apiVersion: API_VERSION_WITH_EXTENDED_TYPES})
    const {
      schemaType: fieldSchemaType,
      path,
      documentId,
      documentSchemaType,
      documentIsAssistable,
    } = props
    const isDocumentLevel = path.length === 0
    const readOnly = fieldSchemaType.readOnly === true

    const docTransTypes = config.translate?.document?.documentTypes
    // oxlint-disable-next-line no-unsafe-type-assertion
    const options = fieldSchemaType?.options as AssistOptions | undefined
    const addFieldAction = isDocumentLevel || options?.aiAssist?.translateAction

    const fieldTransEnabled =
      addFieldAction &&
      documentSchemaType &&
      config.translate?.field?.documentTypes?.includes(documentSchemaType.name)
    const documentTranslationEnabled =
      addFieldAction &&
      documentSchemaType &&
      ((!docTransTypes && isAssistSupported(fieldSchemaType)) ||
        docTransTypes?.includes(documentSchemaType.name))

    const isActive = !!(documentSchemaType && (documentTranslationEnabled || fieldTransEnabled))

    const {value: documentValue, onChange: documentOnChange, formState} = useDocumentPane()
    const docRef = useRef(documentValue)
    docRef.current = documentValue
    const formStateRef = useRef(formState)
    formStateRef.current = formState

    const translationApi = useTranslate(apiClient)
    const translate = useDraftDelayedTask({
      documentOnChange,
      isDocAssistable: documentIsAssistable ?? false,
      task: translationApi.translate,
    })

    const styleguide = config.translate?.styleguide
    const languagePath = config.translate?.document?.languageField

    const translateDocumentAction = useMemo(() => {
      if (!isActive || !languagePath || !documentTranslationEnabled) {
        return undefined
      }
      const title = path.length ? `Translate` : `Translate document`
      return node({
        type: 'action',
        icon: translationApi.loading
          ? () => (
              <Box style={{height: 17}}>
                <Spinner style={{transform: 'translateY(6px)'}} />
              </Box>
            )
          : TranslateIcon,
        title,
        onAction: () => {
          if (translationApi.loading || !languagePath || !documentId) {
            return
          }
          translate({
            languagePath,
            translatePath: path,
            styleguide: createStyleGuideResolver(styleguide, {
              client,
              documentId,
              schemaType: documentSchemaType,
            }),
            documentId: documentId ?? '',
            conditionalMembers: formStateRef.current
              ? getConditionalMembers(formStateRef.current)
              : [],
          })
        },
        renderAsButton: true,
        disabled: translationApi.loading || readOnly,
      })
    }, [
      isActive,
      languagePath,
      translate,
      styleguide,
      documentId,
      translationApi.loading,
      documentTranslationEnabled,
      path,
      readOnly,
      client,
      documentSchemaType,
    ])
    const fieldTranslate = useFieldTranslation()
    const openFieldTranslation = useDraftDelayedTask({
      documentOnChange,
      isDocAssistable: documentIsAssistable ?? false,
      task: fieldTranslate.openFieldTranslation,
    })

    const maxDepth = config.translate?.field?.maxPathDepth
    const translateFieldsAction = useMemo(
      () =>
        isActive && fieldTransEnabled
          ? node({
              type: 'action',
              icon: fieldTranslate.translationLoading
                ? () => (
                    <Box style={{height: 17}}>
                      <Spinner style={{transform: 'translateY(6px)'}} />
                    </Box>
                  )
                : TranslateIcon,
              title: `Translate fields...`,
              onAction: () => {
                if (fieldTranslate.translationLoading || !documentId) {
                  return
                }
                if (formStateRef.current) {
                  getConditionalMembers(formStateRef.current)
                }
                openFieldTranslation({
                  document: {
                    ...docRef.current,
                    _id: documentId,
                  },
                  documentSchema: documentSchemaType,
                  translatePath: path,
                  conditionalMembers: formStateRef.current
                    ? getConditionalMembers(formStateRef.current, maxDepth)
                    : [],
                })
              },
              renderAsButton: true,
              disabled: fieldTranslate.translationLoading || readOnly,
            })
          : undefined,
      [
        isActive,
        openFieldTranslation,
        documentSchemaType,
        documentId,
        fieldTranslate.translationLoading,
        fieldTransEnabled,
        path,
        readOnly,
        maxDepth,
      ],
    )

    return useMemo(() => {
      if (!isActive || !status?.initialized) {
        // oxlint-disable-next-line no-unsafe-type-assertion
        return undefined as unknown as DocumentFieldActionItem
      }
      return node({
        type: 'group',
        icon: () => null,
        title: 'Translation',
        children: [translateDocumentAction, translateFieldsAction].filter(
          (c): c is DocumentFieldActionItem => !!c,
        ),
        expanded: true,
      })
    }, [isActive, translateDocumentAction, translateFieldsAction, status])
  },
}
