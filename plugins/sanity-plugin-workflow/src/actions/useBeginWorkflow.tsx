import {SplitVerticalIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {LexoRank} from 'lexorank'
import {useCallback, useState} from 'react'
import {type DocumentActionDescription, type DocumentActionProps, useClient} from 'sanity'

import {useWorkflowContext} from '../components/WorkflowContext'
import {API_VERSION} from '../constants'

export function useBeginWorkflow({
  id,
  draft,
}: DocumentActionProps): DocumentActionDescription | null {
  const {metadata, loading, error, states} = useWorkflowContext(id)
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const [beginning, setBeginning] = useState(false)
  const [complete, setComplete] = useState(false)

  if (error) {
    console.error(error)
  }

  const handle = useCallback(async () => {
    setBeginning(true)
    const lowestOrderFirstState = await client.fetch(
      /* groq */ `*[_type == "workflow.metadata" && state == $state]|order(orderRank)[0].orderRank`,
      {state: states?.[0]?.id},
    )
    await client.createIfNotExists({
      _id: `workflow-metadata.${id}`,
      _type: `workflow.metadata`,
      documentId: id,
      state: states?.[0]?.id,
      orderRank: lowestOrderFirstState
        ? LexoRank.parse(lowestOrderFirstState).genNext().toString()
        : LexoRank.min().toString(),
    })
    toast.push({
      status: 'success',
      title: 'Workflow started',
      description: `Document is now "${states?.[0]?.title}"`,
    })
    setBeginning(false)
    // Optimistically remove action
    setComplete(true)
  }, [id, states, client, toast])

  if (!draft || complete || metadata) {
    return null
  }

  return {
    icon: SplitVerticalIcon,
    disabled: metadata || loading || Boolean(error) || beginning || complete,
    label: beginning ? `Beginning...` : `Begin Workflow`,
    onHandle: handle,
  }
}
