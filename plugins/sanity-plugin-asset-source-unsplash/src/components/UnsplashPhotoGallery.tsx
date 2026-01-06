import {Box, Text} from '@sanity/ui'
import {use, Activity} from 'react'
import {RowsPhotoAlbum} from 'react-photo-album'
import InfiniteScroll from 'react-photo-album/scroll'
import {type AssetFromSource, type AssetSourceComponentProps, type SanityClient} from 'sanity'

import type {FetcherResult, UnsplashPhoto} from '../types'

import {reactPhotoAlbumCss} from '../constants'
import {fetchDownloadUrl} from '../datastores/unsplash'
import {Loader} from './Loader'
import {UnsplashCreditLine} from './UnsplashCreditLine'

const PHOTO_SPACING = 2
const PHOTO_PADDING = 1 // offset the 1px border width

function mapUnsplashToPhotoAlbumPhoto(photo: UnsplashPhoto) {
  return {
    src: photo.urls.small,
    width: photo.width,
    height: photo.height,
    key: photo.id,
    data: photo,
  }
}

export default function UnsplashAssetSourceGallery({
  client,
  query,
  fetcher,
  scrollContainerRef,
  onSelect,
  initialDataPromise,
}: {
  client: SanityClient
  query: string
  fetcher: (query: string, index: number) => Promise<FetcherResult>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  initialDataPromise: Promise<FetcherResult>
} & Pick<AssetSourceComponentProps, 'onSelect'>) {
  const data = use(initialDataPromise)

  return (
    <>
      <link rel="stylesheet" href={reactPhotoAlbumCss} precedence="default" />
      <Activity mode={data.total === 0 ? 'visible' : 'hidden'}>
        <Box paddingX={2} paddingY={3}>
          <Text size={1} muted>
            No results found for "{query}"
          </Text>
        </Box>
      </Activity>
      <Activity mode={data.total === 0 ? 'hidden' : 'visible'}>
        <InfiniteScroll
          key={query}
          scrollContainer={() => scrollContainerRef.current}
          photos={data.results.map(mapUnsplashToPhotoAlbumPhoto)}
          fetch={async (index) => {
            const {results, total_pages} = await fetcher(query, index + 1)

            if (index < total_pages) {
              return results.map(mapUnsplashToPhotoAlbumPhoto)
            }

            return null
          }}
          loading={<Loader />}
          finished={
            query && (
              <Box paddingX={2} paddingY={3}>
                <Text size={1} muted>
                  No more results
                </Text>
              </Box>
            )
          }
          onClick={async ({photo: {data: photo}}) => {
            const downloadUrl = await fetchDownloadUrl(client, photo)

            const description = photo.description || undefined
            const asset: AssetFromSource = {
              kind: 'url',
              value: downloadUrl,
              // @ts-expect-error TODO: this is a partial assetDocumentProps, update types.
              assetDocumentProps: {
                _type: 'sanity.imageAsset',
                source: {
                  name: 'unsplash',
                  id: photo.id,
                  url: photo.links.html,
                },
                description,
                creditLine: `${photo.user.name} by Unsplash`,
              },
            }
            return onSelect([asset])
          }}
        >
          <RowsPhotoAlbum<ReturnType<typeof mapUnsplashToPhotoAlbumPhoto>>
            photos={[]}
            spacing={PHOTO_SPACING}
            padding={PHOTO_PADDING}
            targetRowHeight={(width) => {
              if (width < 300) return 150
              if (width < 600) return 200
              return 300
            }}
            render={{
              extras: (_, context) => {
                return (
                  <UnsplashCreditLine
                    id={context.photo.data.id}
                    link={context.photo.data.links.html}
                    userName={context.photo.data.user.username}
                  />
                )
              },
            }}
            componentsProps={{container: {style: {marginBottom: PHOTO_SPACING}}}}
          />
        </InfiniteScroll>
      </Activity>
    </>
  )
}
