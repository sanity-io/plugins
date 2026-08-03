import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Card, Dialog, Flex, Inline, Stack, Text, TextInput} from '@sanity/ui'
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  use,
  Suspense,
  Activity,
} from 'react'

import 'react-photo-album/rows.css'
import {RowsPhotoAlbum} from 'react-photo-album'
import InfiniteScroll from 'react-photo-album/scroll'
import {type ObjectInputProps, PatchEvent, set, useClient, useDataset, useProjectId} from 'sanity'
import {styled} from 'styled-components'

import {fetchAssets} from '../datastores/shopify'
import type {Asset, ShopifyAPIResponse, ShopifyFile} from '../types'
import {extractName} from '../utils/helpers'
import DialogHeader from './DialogHeader'
import File from './File'
import {Loader} from './Loader'
import {Search} from './ShopifyAssetInput.styled'

const RESULTS_PER_PAGE = 42
const PHOTO_SPACING = 2
const PHOTO_PADDING = 1
const SEARCH_DEBOUNCE_MS = 500

const StyledDialog = styled(Dialog)`
  & > [data-ui='DialogCard'] > [data-ui='Card'] {
    height: 100%;
  }
`

function mapShopifyFileToPhoto(file: ShopifyFile) {
  return {
    src: file.preview?.url || file.url,
    width: file.preview?.width || 2048,
    height: file.preview?.height || 2048,
    key: file.id,
    alt: extractName(file.url),
    data: file,
  }
}

type ShopifyPhoto = ReturnType<typeof mapShopifyFileToPhoto>

function createFetcher(params: {projectId: string; dataset: string; shop: string; token?: string}) {
  return async function fetcher(query: string, cursor: string): Promise<ShopifyAPIResponse> {
    return fetchAssets({
      ...params,
      query,
      cursor,
      resultsPerPage: RESULTS_PER_PAGE,
    })
  }
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const maybeAxiosError = err as {
      response?: {data?: {message?: string}}
      message?: string
    }
    const message = maybeAxiosError.response?.data?.message || maybeAxiosError.message
    if (message) {
      return `${message} - check plugin configuration`
    }
  }
  return 'An error occurred - check plugin configuration'
}

export interface AssetPickerProps extends ObjectInputProps<Asset> {
  shopifyDomain: string
  isOpen: boolean
  onClose: () => void
}

export default function ShopifyAssetPicker(props: AssetPickerProps) {
  const {isOpen, onClose, shopifyDomain, onChange, schemaType, value} = props
  const projectId = useProjectId()
  const dataset = useDataset()
  const client = useClient({apiVersion: '2021-06-07'})
  const token = client.config().token

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [apiError, setApiError] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const error = shopifyDomain
    ? apiError
    : 'Please configure your Shopify domain in the plugin config'

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setApiError('')
      setDebouncedQuery(query)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [query])

  const fetcher = useMemo(
    () =>
      createFetcher({
        projectId,
        dataset,
        shop: shopifyDomain,
        token,
      }),
    [projectId, dataset, shopifyDomain, token],
  )

  const initialDataPromise = useMemo(
    () =>
      fetcher(debouncedQuery, '').catch((err: unknown) => {
        setApiError(getErrorMessage(err))
        return {
          assets: [],
          pageInfo: {cursor: '', hasNextPage: false},
        } satisfies ShopifyAPIResponse
      }),
    [debouncedQuery, fetcher],
  )

  const handleSearchTermChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value)
  }

  const handleSelect = (file: ShopifyFile) => {
    const nextValue: Asset = {
      ...file,
      filename: extractName(file.url),
      _key: value?._key,
      _type: schemaType.name,
    }
    onChange(PatchEvent.from([set(nextValue)]))
    onClose()
  }

  return (
    <StyledDialog
      id="shopify-asset-source"
      header={<DialogHeader title="Shopify Assets" shopifyDomain={shopifyDomain} />}
      onClose={onClose}
      open={isOpen}
      height="100%"
      width={4}
    >
      <Stack
        ref={scrollContainerRef}
        gap={3}
        padding={4}
        height="stretch"
        style={{overflow: 'hidden scroll', overflowX: 'clip', overflowY: 'scroll'}}
      >
        {error ? (
          <Card overflow="hidden" padding={4} radius={2} shadow={1} tone="critical">
            <Flex align="center" gap={3}>
              <Text size={2}>
                <ErrorOutlineIcon />
              </Text>
              <Inline gap={2}>
                <Text size={1}>{error}</Text>
              </Inline>
            </Flex>
          </Card>
        ) : (
          <>
            <Box style={{position: 'sticky', top: 0, zIndex: 1}}>
              <Card>
                <Search gap={3}>
                  <Text size={1} weight="semibold">
                    Search Shopify for assets
                  </Text>
                  <TextInput
                    label="Search Images"
                    placeholder="filename.jpg"
                    value={query}
                    onChange={handleSearchTermChanged}
                  />
                </Search>
              </Card>
            </Box>
            <Suspense fallback={<Loader />}>
              <ShopifyAssetGallery
                key={debouncedQuery}
                query={debouncedQuery}
                fetcher={fetcher}
                scrollContainerRef={scrollContainerRef}
                onSelect={handleSelect}
                onError={setApiError}
                initialDataPromise={initialDataPromise}
              />
            </Suspense>
          </>
        )}
      </Stack>
    </StyledDialog>
  )
}

function ShopifyAssetGallery({
  query,
  fetcher,
  scrollContainerRef,
  onSelect,
  onError,
  initialDataPromise,
}: {
  query: string
  fetcher: (query: string, cursor: string) => Promise<ShopifyAPIResponse>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  onSelect: (file: ShopifyFile) => void
  onError: (message: string) => void
  initialDataPromise: Promise<ShopifyAPIResponse>
}) {
  const data = use(initialDataPromise)
  // Remounted per query via `key`, so the initial pageInfo is the pagination baseline.
  const paginationRef = useRef({
    cursor: data.pageInfo.cursor,
    hasNextPage: data.pageInfo.hasNextPage,
  })

  const initialPhotos = data.assets.map(mapShopifyFileToPhoto)

  return (
    <>
      <Activity mode={initialPhotos.length === 0 ? 'visible' : 'hidden'}>
        <Box paddingX={2} paddingY={3}>
          <Text size={1} muted>
            {query ? `No results found for "${query}"` : 'No results found'}
          </Text>
        </Box>
      </Activity>
      <Activity mode={initialPhotos.length === 0 ? 'hidden' : 'visible'}>
        <InfiniteScroll
          photos={initialPhotos}
          scrollContainer={() => scrollContainerRef.current}
          fetch={async () => {
            if (!paginationRef.current.hasNextPage) {
              return null
            }

            try {
              const results = await fetcher(query, paginationRef.current.cursor)
              paginationRef.current = {
                cursor: results.pageInfo.cursor,
                hasNextPage: results.pageInfo.hasNextPage,
              }

              if (results.assets.length === 0) {
                return null
              }

              return results.assets.map(mapShopifyFileToPhoto)
            } catch (err) {
              onError(getErrorMessage(err))
              return null
            }
          }}
          loading={<Loader />}
          finished={
            <Flex align="center" justify="center" padding={3}>
              <Text size={1} muted>
                No more results
              </Text>
            </Flex>
          }
          onClick={({photo}) => {
            onSelect(photo.data)
          }}
        >
          <RowsPhotoAlbum<ShopifyPhoto>
            photos={[]}
            spacing={PHOTO_SPACING}
            padding={PHOTO_PADDING}
            targetRowHeight={(width) => {
              if (width < 300) return 150
              if (width < 600) return 200
              return 300
            }}
            render={{
              extras: (_, context) => <File data={context.photo.data} />,
            }}
            componentsProps={{container: {style: {marginBottom: PHOTO_SPACING}}}}
          />
        </InfiniteScroll>
      </Activity>
    </>
  )
}
