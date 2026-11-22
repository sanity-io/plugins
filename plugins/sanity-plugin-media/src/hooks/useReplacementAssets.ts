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
  key: string
  /** One entry per loaded page, as returned by the server. */
  pages: ImageAsset[][]
  requestId: string
}

const requestIdOf = ({attempt, key, pageIndex}: PageRequest) => `${key}|${pageIndex}|${attempt}`

/**
 * Flattens loaded pages, keeping the first occurrence of each asset. Offset paging can
 * return the same asset on two pages when images are uploaded or deleted while the dialog
 * is open, which would otherwise render a repeated card with a duplicate key.
 */
function mergePages(pages: ImageAsset[][]): ImageAsset[] {
  const seen = new Set<string>()
  const items: ImageAsset[] = []
  for (const page of pages) {
    for (const asset of page) {
      if (!seen.has(asset._id)) {
        seen.add(asset._id)
        items.push(asset)
      }
    }
  }
  return items
}

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
  const localeIds = useTypedSelector((state) => state.assets.localeIds)
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
      localeIds,
      pageIndex,
      showMediaLibraryAssets,
    })
    const currentRequestId = requestIdOf({attempt, key, pageIndex})

    const subscription = client.observable.fetch<ImageAsset[]>(query, params).subscribe({
      next: (page) => {
        setResult((previous) => {
          // Keep earlier pages for the same filters; drop results for previous filters.
          const earlierPages = previous?.key === key ? previous.pages.slice(0, pageIndex) : []
          return {
            hasMore: page.length === REPLACEMENT_PAGE_SIZE,
            key,
            pages: [...earlierPages, page],
            requestId: currentRequestId,
          }
        })
      },
      error: (error: unknown) => {
        setResult((previous) => ({
          error: error instanceof Error ? error.message : 'Internal error',
          hasMore: previous?.key === key ? previous.hasMore : false,
          key,
          pages: previous?.key === key ? previous.pages : [],
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
    localeIds,
    pageIndex,
    searchQuery,
    showMediaLibraryAssets,
    tagId,
  ])

  const items = mergePages(result?.pages ?? [])

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
    items,
    loading,
    loadMore,
    retry,
  }
}
