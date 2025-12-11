import {useMemo} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import type {KeyedMetadata, Metadata} from '../types'

import {API_VERSION} from '../constants'

/**
 * Takes the published ID of documents and return the metadata for those documents.
 *
 * @param ids Source document published IDs
 */
export function useWorkflowMetadata(ids: string[]): {
  data: KeyedMetadata
  loading: boolean
  error: unknown
} {
  const {
    data: _rawData,
    loading,
    error,
  } = useListeningQuery<Metadata[]>(
    `*[_type == "workflow.metadata" && documentId in $ids]{
      _id,
      _type,
      _rev,
      assignees,
      documentId,
      state,
      orderRank
    }`,
    {
      params: {ids},
      options: {apiVersion: API_VERSION},
    },
  )
  // oxlint-disable-next-line no-unsafe-type-assertion
  const rawData = _rawData as Metadata[]

  const keyedMetadata = useMemo(() => {
    if (!rawData || rawData.length === 0) return {}

    const acc: KeyedMetadata = {}
    for (const item of rawData) {
      acc[item.documentId] = item
    }
    return acc
  }, [rawData])

  return {data: keyedMetadata, loading, error}
}
