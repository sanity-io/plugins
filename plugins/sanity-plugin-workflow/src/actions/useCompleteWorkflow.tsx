import {CheckmarkIcon} from '@sanity/icons'
import {type ToastContextValue, useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {
  type DocumentActionDescription,
  type DocumentActionProps,
  type SanityClient,
  useClient,
} from 'sanity'

import {useWorkflowContext} from '../components/WorkflowContext'
import {API_VERSION} from '../constants'

export const handleDeleteMetadata = async (
  client: SanityClient,
  toast: ToastContextValue,
  id: string,
) => {
  try {
    await client.delete(`workflow-metadata.${id}`)
    toast.push({
      status: 'success',
      title: 'Workflow completed',
    })
  } catch (error) {
    console.error(error)
    toast.push({
      status: 'error',
      title: 'Could not complete Workflow',
    })
  }
}

export function useCompleteWorkflow({
  id,
  onComplete,
}: DocumentActionProps): DocumentActionDescription | null {
  const {metadata, loading, error, states} = useWorkflowContext(id)
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  if (error) {
    console.error(error)
  }

  const handle = useCallback(async () => {
    await handleDeleteMetadata(client, toast, id)
  }, [client, toast, id])

  if (!metadata) {
    return null
  }

  const state = states.find((s) => s.id === metadata.state)
  const isLastState = state?.id === states?.[states?.length - 1]?.id

  return {
    icon: CheckmarkIcon,
    disabled: loading || Boolean(error) || !isLastState,
    label: `Complete Workflow`,
    title: isLastState
      ? `Removes the document from the Workflow process`
      : `Cannot remove from workflow until in the last state`,
    onHandle: async () => {
      await handle()
      onComplete()
    },
    tone: 'positive',
  }
}
