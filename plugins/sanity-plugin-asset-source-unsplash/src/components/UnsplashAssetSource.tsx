import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Dialog, Flex, Spinner, Stack, Box, Text, TextInput} from '@sanity/ui'
import {memoize} from 'lodash-es'
import {
  Component,
  Suspense,
  startTransition,
  use,
  useMemo,
  Activity,
  useRef,
  useState,
  useOptimistic,
} from 'react'
import 'react-photo-album/rows.css'
import {RowsPhotoAlbum, type RenderPhotoProps, type Photo as PhotoType} from 'react-photo-album'
import InfiniteScroll from 'react-photo-album/scroll'
import {BehaviorSubject, type Subscription} from 'rxjs'
import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type SanityClient,
  useClient,
} from 'sanity'
import {styled, keyframes} from 'styled-components'

import type {UnsplashPhoto} from '../types'

import {fetchDownloadUrl, search} from '../datastores/unsplash'
import Photo from './Photo'
import {CreditLine, CreditLineLink} from './Photo.styled'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

function SearchInput({
  value,
  changeAction,
}: {
  value: string
  changeAction: (value: string) => Promise<void> | void
}) {
  const [inputValue, setInputValue] = useOptimistic(value)
  const isPending = inputValue !== value
  function handleChange(newValue: string) {
    startTransition(async () => {
      setInputValue(newValue)
      await changeAction(newValue)
    })
  }

  return (
    <TextInput
      clearButton={inputValue.length > 0 && !isPending}
      icon={SearchIcon}
      onChange={(event) => handleChange(event.currentTarget.value)}
      onClear={() => handleChange('')}
      placeholder="Search by topics or colors"
      value={inputValue}
      iconRight={isPending && AnimatedSpinnerIcon}
    />
  )
}

type UnsplashPhotoAlbumPhoto = PhotoType & {
  key: string
  data: UnsplashPhoto
}

type State = {
  query: string
  searchResults: UnsplashPhoto[][]
  page: number
  isLoading: boolean
  cursor: number
}

const RESULTS_PER_PAGE = 42
const PHOTO_SPACING = 2
const PHOTO_PADDING = 1 // offset the 1px border width

type FetcherResult = {
  results: UnsplashPhoto[]
  total: number
  total_pages: number
}

const StyledDialog = styled(Dialog)`
  & > [data-ui='DialogCard'] > [data-ui='Card'] {
    height: 100%;
  }
`

export function UnsplashAssetSource({onClose}: AssetSourceComponentProps) {
  const client = useClient({apiVersion: '2022-09-01'})
  const fetcher = useMemo(
    () =>
      memoize(
        async function fetcher(query: string, page: number): Promise<FetcherResult> {
          const searchParams = new URLSearchParams({
            page: `${page}`,
            per_page: `${RESULTS_PER_PAGE}`,
          })
          if (query.trim()) {
            searchParams.set('query', query.trim())
            return client.request<{
              results: UnsplashPhoto[]
              total: number
              total_pages: number
            }>({
              url: `/addons/unsplash/search/photos?${searchParams}`,
              withCredentials: true,
              method: 'GET',
            })
          }
          searchParams.set('order_by', 'popular')
          return client
            .request<UnsplashPhoto[]>({
              url: `/addons/unsplash/photos?${searchParams}`,
              withCredentials: true,
              method: 'GET',
            })
            .then((results) => ({
              results,
              total: results.length,
              total_pages: Math.ceil(results.length / RESULTS_PER_PAGE),
            }))
        },
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
        space={1}
        paddingLeft={3}
        height="stretch"
        style={{overflow: 'hidden scroll', overflowX: 'clip', overflowY: 'scroll'}}
      >
        <Box style={{position: 'sticky', top: 0, zIndex: 1}}>
          <SearchInput changeAction={setQuery} value={query} />
        </Box>
        <Suspense fallback={<Loader />}>
          <UnsplashAssetSourceGallery
            query={query}
            fetcher={fetcher}
            scrollContainerRef={scrollContainerRef}
          />
        </Suspense>
      </Stack>
    </StyledDialog>
  )
}

function Loader() {
  return (
    <Flex align="center" justify="center" padding={3}>
      <Spinner muted />
    </Flex>
  )
}

function mapUnsplashToPhotoAlbumPhoto(photo: UnsplashPhoto) {
  return {
    src: photo.urls.small,
    width: photo.width,
    height: photo.height,
    key: photo.id,
    data: photo,
  }
}

function UnsplashAssetSourceGallery({
  query,
  fetcher,
  scrollContainerRef,
}: {
  query: string
  fetcher: (query: string, index: number) => Promise<FetcherResult>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  const data = use(fetcher(query, 1))

  return (
    <>
      <Activity mode={data.total === 0 ? 'visible' : 'hidden'}>
        <Text size={1} muted>
          No results found
        </Text>
      </Activity>
      <Activity mode={data.total === 0 ? 'hidden' : 'visible'}>
        <InfiniteScroll
          key={query}
          scrollContainer={() => scrollContainerRef.current}
          photos={data.results.map(mapUnsplashToPhotoAlbumPhoto)}
          fetch={async (index) => {
            console.log('cody', 'fetching', index)
            const {results, total, total_pages} = await fetcher(query, index + 1)

            console.log('cody', {query, index, results, total, total_pages})

            if (index < total_pages) {
              return results.map(mapUnsplashToPhotoAlbumPhoto)
            }

            return null
          }}
          loading={<Loader />}
          finished={
            query && (
              <Text size={1} muted>
                No more results
              </Text>
            )
          }
          onClick={(photo) => {
            console.log('onClick', photo)
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
                return null
              },
            }}
            componentsProps={{container: {style: {marginBottom: PHOTO_SPACING}}}}
          />
        </InfiniteScroll>
      </Activity>
    </>
  )
}

const UTM_SOURCE = 'sanity-plugin-asset-source-unsplash'
function UnsplashCreditLine({link, id, userName}: {link: string; id: string; userName: string}) {
  const url = new URL(link)
  url.searchParams.set('utm_source', UTM_SOURCE)
  url.searchParams.set('utm_medium', 'referral')

  return (
    <CreditLineLink href={url.toString()} target={id} rel="noreferrer noopener">
      <CreditLine padding={1} radius={2} margin={1}>
        <Text size={0} title={`Open image by ${userName} on Unsplash in new window`}>
          By @{userName}
        </Text>
      </CreditLine>
    </CreditLineLink>
  )
}

class UnsplashAssetSourceInternal extends Component<
  AssetSourceComponentProps & {client: SanityClient},
  State
> {
  static defaultProps = {
    selectedAssets: undefined,
  }

  override state = {
    cursor: 0,
    query: '',
    page: 1,
    searchResults: [[]],
    isLoading: true,
  }

  searchSubscription: Subscription | null = null

  searchSubject$ = new BehaviorSubject('')
  pageSubject$ = new BehaviorSubject(1)

  override componentDidMount() {
    this.searchSubscription = search(
      this.props.client,
      this.searchSubject$,
      this.pageSubject$,
      RESULTS_PER_PAGE,
    ).subscribe({
      next: (results: UnsplashPhoto[]) => {
        this.setState((prev) => ({
          searchResults: [...prev.searchResults, results],
          isLoading: false,
        }))
      },
    })
  }

  override componentWillUnmount() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe()
    }
  }

  handleSelect = (photo: UnsplashPhoto) => {
    this.setState({isLoading: true})
    return fetchDownloadUrl(this.props.client, photo).then((downloadUrl) => {
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
      this.props.onSelect([asset])
      return undefined
    })
  }

  handleClose = () => {
    this.props.onClose()
  }

  handleSearchTermChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value
    this.setState({
      query,
      page: 1,
      searchResults: [[]],
      isLoading: true,
      cursor: 0,
    })
    this.pageSubject$.next(1)
    this.searchSubject$.next(query)
  }

  handleSearchTermCleared = () => {
    this.setState({
      query: '',
      page: 1,
      searchResults: [[]],
      isLoading: true,
      cursor: 0,
    })
    this.pageSubject$.next(1)
    this.searchSubject$.next('')
  }

  handleScrollerLoadMore = () => {
    const nextPage = this.state.page + 1
    this.setState({page: nextPage, isLoading: true})
    this.pageSubject$.next(nextPage)
    this.searchSubject$.next(this.state.query)
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const {cursor} = this.state
    if ((event.keyCode === 38 || event.keyCode === 37) && cursor > 0) {
      this.setState((prevState) => ({
        cursor: prevState.cursor - 1,
      }))
    } else if (
      (event.keyCode === 40 || event.keyCode === 39) &&
      cursor < this.getPhotos().length - 1
    ) {
      this.setState((prevState) => ({
        cursor: prevState.cursor + 1,
      }))
    }
  }

  getPhotos() {
    return this.state.searchResults.flat()
  }

  updateCursor = (photo: UnsplashPhoto) => {
    const index = this.getPhotos().findIndex((result: UnsplashPhoto) => result.id === photo.id)
    this.setState({cursor: index})
  }

  renderImage = (props: RenderPhotoProps<UnsplashPhotoAlbumPhoto>) => {
    const {photo, layout} = props
    const active =
      this.getPhotos().findIndex((result: UnsplashPhoto) => result.id === photo.data.id) ===
        this.state.cursor || false
    return (
      <Photo
        onClick={this.handleSelect}
        onKeyDown={this.handleKeyDown}
        data={photo.data}
        width={layout.width}
        height={layout.height}
        active={active}
        onFocus={this.updateCursor}
      />
    )
  }

  override render() {
    const {query, searchResults, isLoading} = this.state

    return (
      <Dialog
        animate
        id="unsplash-asset-source"
        header="Select image from Unsplash"
        onClose={this.handleClose}
        open
        width={4}
      >
        <Stack space={3} paddingX={4} paddingBottom={4}>
          <SearchInput
            clearButton={query.length > 0}
            icon={SearchIcon}
            onChange={this.handleSearchTermChanged}
            onClear={this.handleSearchTermCleared}
            placeholder="Search by topics or colors"
            value={query}
          />
          {!isLoading && this.getPhotos().length === 0 && (
            <Text size={1} muted>
              No results found
            </Text>
          )}
          <InfiniteScroll
            dataLength={this.getPhotos().length} // This is important field to render the next data
            next={this.handleScrollerLoadMore}
            hasMore
            scrollThreshold={0.99}
            height="60vh"
            loader={
              <Flex align="center" justify="center" padding={3}>
                <Spinner muted />
              </Flex>
            }
            endMessage={
              <Text size={1} muted>
                No more results
              </Text>
            }
          >
            {searchResults
              .filter((photos) => photos.length > 0)
              .map((photos: UnsplashPhoto[], index) => (
                <RowsPhotoAlbum
                  key={`gallery-${query || 'popular'}-${index}`}
                  layout="rows"
                  spacing={PHOTO_SPACING}
                  padding={PHOTO_PADDING}
                  targetRowHeight={(width) => {
                    if (width < 300) return 150
                    if (width < 600) return 200
                    return 300
                  }}
                  photos={photos.map((photo: UnsplashPhoto) => ({
                    src: photo.urls.small,
                    width: photo.width,
                    height: photo.height,
                    key: photo.id,
                    data: photo,
                  }))}
                  renderPhoto={this.renderImage}
                  componentsProps={{
                    containerProps: {
                      style: {marginBottom: `${PHOTO_SPACING}px`},
                    },
                  }}
                />
              ))}
          </InfiniteScroll>
        </Stack>
      </Dialog>
    )
  }
}
