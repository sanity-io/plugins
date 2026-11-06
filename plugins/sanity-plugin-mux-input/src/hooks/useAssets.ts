import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import type {Observable} from 'rxjs'
import {collate, useDocumentStore} from 'sanity'

import {SANITY_API_VERSION} from '../hooks/useClient'
import {createSearchFilter} from '../util/createSearchFilter'
import type {VideoAssetDocument} from '../util/types'

export const ASSET_SORT_OPTIONS = {
  createdDesc: {groq: '_createdAt desc', label: 'Newest first'},
  createdAsc: {groq: '_createdAt asc', label: 'First created (oldest)'},
  filenameAsc: {groq: 'filename asc', label: 'By filename (A-Z)'},
  filenameDesc: {groq: 'filename desc', label: 'By filename (Z-A)'},
}

export type SortOption = keyof typeof ASSET_SORT_OPTIONS

export default function useAssets() {
  const documentStore = useDocumentStore()
  const [sort, setSort] = useState<SortOption>('createdDesc')
  const [searchQuery, setSearchQuery] = useState('')

  const assetDocuments$ = useMemo<Observable<VideoAssetDocument[]>>(() => {
    const search = createSearchFilter(searchQuery)
    const filter = [`_type == "mux.videoAsset"`, ...search.filter].filter(Boolean).join(' && ')

    return documentStore.listenQuery(
      /* groq */ `*[${filter}] | order(${ASSET_SORT_OPTIONS[sort].groq})`,
      search.params,
      {apiVersion: SANITY_API_VERSION},
    )
  }, [documentStore, sort, searchQuery])

  // `useObservable` keeps the last emission of this observable across re-subscriptions, so when
  // the Studio hides the tool behind an `<Activity>` boundary and shows it again, the browser
  // keeps its videos while the query reconnects instead of unmounting them behind a spinner.
  // Only a query that has not emitted yet (first load, or a changed search/sort) is loading.
  // That retention is react-rx behaviour rather than a documented guarantee, which is why
  // `useAssets.test.tsx` pins it; check that test when bumping react-rx.
  const assetDocuments = useObservable(assetDocuments$, undefined)
  const isLoading = assetDocuments === undefined

  const assets = useMemo(
    () =>
      // Avoid displaying both drafts & published assets by collating them together and giving preference to drafts
      collate<VideoAssetDocument>(assetDocuments ?? []).map(
        (collated) =>
          ({
            ...(collated.draft || collated.published),
            _id: collated.id,
          }) as VideoAssetDocument,
      ),
    [assetDocuments],
  )

  return {
    assets,
    isLoading,
    sort,
    searchQuery,
    setSort,
    setSearchQuery,
  }
}
