import {Dialog, Stack, Box} from '@sanity/ui'
import memoize from 'lodash-es/memoize.js'
import {lazy, Suspense, useMemo, useRef, useState} from 'react'
import {type AssetSourceComponentProps, useClient} from 'sanity'
import {styled} from 'styled-components'

import {fetchUnsplashPhotos} from '../datastores/unsplash'
import {Loader} from './Loader'
import {SearchInput} from './SearchInput'

const StyledDialog = styled(Dialog)`
  & > [data-ui='DialogCard'] > [data-ui='Card'] {
    height: 100%;
  }
`

const UnsplashAssetSourceGallery = lazy(() => import('./UnsplashPhotoGallery'))

export function UnsplashAssetSource({onClose, onSelect}: AssetSourceComponentProps) {
  const client = useClient({apiVersion: '2022-09-01'})
  const fetcher = useMemo(
    () =>
      memoize(
        (query: string, page: number) => fetchUnsplashPhotos(client, query, page),
        (query, page) => JSON.stringify({query, page}),
      ),
    [client],
  )

  const [query, setQuery] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  return (
    <StyledDialog
      animate
      id="unsplash-asset-source"
      header="Select image from Unsplash"
      onClose={() => onClose()}
      open
      height="100%"
      width={4}
    >
      <Stack
        ref={scrollContainerRef}
        gap={1}
        paddingLeft={3}
        height="stretch"
        style={{overflow: 'hidden scroll', overflowX: 'clip', overflowY: 'scroll'}}
      >
        <Box style={{position: 'sticky', top: 0, zIndex: 1}}>
          <SearchInput changeAction={setQuery} value={query} />
        </Box>
        <Suspense fallback={<Loader />}>
          <UnsplashAssetSourceGallery
            client={client}
            query={query}
            fetcher={fetcher}
            scrollContainerRef={scrollContainerRef}
            onSelect={onSelect}
            initialDataPromise={fetcher(query, 1)}
          />
        </Suspense>
      </Stack>
    </StyledDialog>
  )
}
