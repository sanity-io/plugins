import {ImageIcon} from '@sanity/icons/Image'
import {Box, Spinner} from '@sanity/ui'
import {useContext, useMemo} from 'react'
import type {DocumentFieldAction, DocumentFieldActionGroup, DocumentFieldActionItem} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useAssistDocumentContext} from '../assistDocument/AssistDocumentContext'
import {aiInspectorId} from '../assistInspector/constants'
import {useAiAssistanceConfig} from '../assistLayout/AiAssistanceConfigContext'
import {ImageContext} from '../components/ImageContext'
import {usePathKey} from '../helpers/misc'
import {fieldPathParam, instructionParam} from '../types'
import {canUseAssist, useApiClient, useGenerateCaption} from '../useApiClient'

function node(node: DocumentFieldActionItem | DocumentFieldActionGroup) {
  return node
}

export const generateCaptionsActions: DocumentFieldAction = {
  name: 'sanity-assist-generate-captions',
  useAction(props) {
    const pathKey = usePathKey(props.path)
    const {openInspector} = useDocumentPane()

    const {config, status} = useAiAssistanceConfig()
    const apiClient = useApiClient(config?.__customApiClient)
    const {generateCaption, loading} = useGenerateCaption(apiClient)
    const imageContext = useContext(ImageContext)
    const {assistableDocumentId} = useAssistDocumentContext()

    const isActive = !!imageContext && pathKey === imageContext?.imageDescriptionPath
    const languagePath = config.translate?.document?.languageField

    return useMemo(() => {
      if (!isActive || !imageContext) {
        // works but not supported by types
        // oxlint-disable-next-line no-unsafe-type-assertion
        return undefined as unknown as DocumentFieldActionItem
      }
      return node({
        type: 'action',
        icon: loading
          ? () => (
              <Box style={{height: 17}}>
                <Spinner style={{transform: 'translateY(6px)'}} />
              </Box>
            )
          : ImageIcon,
        title: 'Generate image description',
        onAction: () => {
          if (loading) {
            return
          }
          if (!canUseAssist(status)) {
            openInspector(aiInspectorId, {
              [fieldPathParam]: pathKey,
              // oxlint-disable-next-line no-unsafe-type-assertion
              [instructionParam]: undefined as any,
            })
            return
          }
          void generateCaption({path: pathKey, documentId: assistableDocumentId, languagePath})
        },
        renderAsButton: true,
        disabled: loading,
        hidden: !imageContext.assetRef,
      })
    }, [
      isActive,
      imageContext,
      generateCaption,
      pathKey,
      assistableDocumentId,
      loading,
      status,
      openInspector,
      languagePath,
    ])
  },
}
