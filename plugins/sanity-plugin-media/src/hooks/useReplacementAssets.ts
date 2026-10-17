import {useEffect, useState} from 'react'

import type {ImageAsset} from '../types'
import {
  constructReplacementQuery,
  REPLACEMENT_PAGE_SIZE,
  type ReplacementFilters,
} from '../utils/constructReplacementQuery'
import useTypedSelector from './useTypedSelector'
import useVersionedClient from './useVersionedClient'

type PageRequest = {
  attempt: number
  key: string
  pageIndex: number
}

type Result = {
  error?: string
  hasMore: boolean
  items: ImageAsset[]
  key: string
  requestId: string
}

const requestIdOf = ({attempt, key, pageIndex}: PageRequest) => `${key}|${pageIndex}|${attempt}`

/**
 * Pages through candidate replacement images with local state, so the replace dialog
 * never touches the browser's search, facets, folder scope or loaded assets.
 */
export function useReplacementAssets({
  assetToReplaceId,
  filters,
}: {
  assetToReplaceId: string
  filters: ReplacementFilters
}): {
  error?: string
  hasMore: boolean
  items: ImageAsset[]
  loading: boolean
  loadMore: () => void
  retry: () => void
} {
  const client = useVersionedClient()
  const excludeTagSlugs = useTypedSelector((state) => state.assets.excludeTagSlugs)
  const showMediaLibraryAssets = useTypedSelector((state) => state.assets.showMediaLibraryAssets)

  const {folderId, tagId} = filters
  const searchQuery = filters.searchQuery.trim()
  const key = JSON.stringify([assetToReplaceId, folderId, searchQuery, tagId])

  const [pageRequest, setPageRequest] = useState<PageRequest>({attempt: 0, key, pageIndex: 0})
  // New filters start over from the first page. Reset the stored request rather than
  // only deriving page 0, so returning to earlier filters doesn't resume their old page.
  if (pageRequest.key !== key) {
    setPageRequest({attempt: 0, key, pageIndex: 0})
  }
  const {attempt, pageIndex} = pageRequest
  const requestId = requestIdOf(pageRequest)

  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const {params, query} = constructReplacementQuery({
      assetToReplaceId,
      excludeTagSlugs,
      filters: {folderId, searchQuery, tagId},
      pageIndex,
      showMediaLibraryAssets,
    })
    const currentRequestId = requestIdOf({attempt, key, pageIndex})

    const subscription = client.observable.fetch<ImageAsset[]>(query, params).subscribe({
      next: (page) => {
        setResult((previous) => {
          // Keep earlier pages for the same filters; drop results for previous filters.
          const earlierPages =
            previous?.key === key ? previous.items.slice(0, pageIndex * REPLACEMENT_PAGE_SIZE) : []
          return {
            hasMore: page.length === REPLACEMENT_PAGE_SIZE,
            items: [...earlierPages, ...page],
            key,
            requestId: currentRequestId,
          }
        })
      },
      error: (error: unknown) => {
        setResult((previous) => ({
          error: error instanceof Error ? error.message : 'Internal error',
          hasMore: previous?.key === key ? previous.hasMore : false,
          items: previous?.key === key ? previous.items : [],
          key,
          requestId: currentRequestId,
        }))
      },
    })

    return () => subscription.unsubscribe()
  }, [
    assetToReplaceId,
    attempt,
    client,
    excludeTagSlugs,
    folderId,
    key,
    pageIndex,
    searchQuery,
    showMediaLibraryAssets,
    tagId,
  ])

  const loading = result?.requestId !== requestId
  const error = loading ? undefined : result?.error
  const hasMore = !loading && !error && result?.key === key && result.hasMore

  const loadMore = () => {
    if (hasMore) {
      setPageRequest({attempt: 0, key, pageIndex: pageIndex + 1})
    }
  }

  const retry = () => {
    setPageRequest({attempt: attempt + 1, key, pageIndex})
  }

  return {
    error,
    hasMore,
    // While new filters load, keep showing the previous results instead of flashing empty.
    items: result?.items ?? [],
    loading,
    loadMore,
    retry,
  }
}
