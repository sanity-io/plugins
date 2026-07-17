import {ImageIcon} from '@sanity/icons/Image'
import {Box, Spinner} from '@sanity/ui'
import {useContext, useMemo} from 'react'
import type {DocumentFieldAction, DocumentFieldActionGroup, DocumentFieldActionItem} from 'sanity'

import {useAssistDocumentContext} from '../assistDocument/AssistDocumentContext'
import {useAiAssistanceConfig} from '../assistLayout/AiAssistanceConfigContext'
import {ImageContext} from '../components/ImageContext'
import {usePathKey} from '../helpers/misc'
import {useApiClient, useGenerateImage} from '../useApiClient'

function node(node: DocumentFieldActionItem | DocumentFieldActionGroup) {
  return node
}

export const generateImagActions: DocumentFieldAction = {
  name: 'sanity-assist-generate-image',
  useAction(props) {
    const pathKey = usePathKey(props.path)

    const {config} = useAiAssistanceConfig()
    const apiClient = useApiClient(config?.__customApiClient)
    const {generateImage, loading} = useGenerateImage(apiClient)

    const imageContext = useContext(ImageContext)
    const {assistableDocumentId} = useAssistDocumentContext()

    const isActive = !!imageContext && pathKey === imageContext?.imageInstructionPath

    return useMemo(() => {
      if (!isActive) {
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
        title: 'Generate image from prompt',
        onAction: () => {
          if (loading) {
            return
          }
          void generateImage({path: pathKey, documentId: assistableDocumentId})
        },
        renderAsButton: true,
        disabled: loading,
      })
    }, [isActive, generateImage, pathKey, assistableDocumentId, loading])
  },
}
