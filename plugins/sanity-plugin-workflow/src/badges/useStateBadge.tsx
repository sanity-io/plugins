import type {DocumentBadgeDescription, DocumentBadgeProps} from 'sanity'

import {useWorkflowContext} from '../components/WorkflowContext'

export function useStateBadge(props: DocumentBadgeProps): DocumentBadgeDescription | null {
  const {id: documentId} = props
  const {metadata, loading, error, states} = useWorkflowContext(documentId)
  const state = states.find((s) => s.id === metadata?.state)

  if (loading || error) {
    if (error) {
      console.error(error)
    }

    return null
  }

  if (!state) {
    return null
  }

  return {
    label: state.title,
    // title: state.title,
    color: state?.color,
  }
}
