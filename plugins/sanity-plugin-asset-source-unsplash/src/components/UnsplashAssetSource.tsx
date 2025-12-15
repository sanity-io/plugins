import {SearchIcon} from '@sanity/icons'
import {Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {Component} from 'react'
import {PhotoAlbum, type RenderPhotoProps, type Photo as PhotoType} from 'react-photo-album'
import InfiniteScroll from 'react-photo-album/scroll'
import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type SanityClient,
  useClient,
} from 'sanity'

import type {UnsplashPhoto} from '../types'

import {fetchDownloadUrl} from '../datastores/unsplash'
import Photo from './Photo'
import {SearchInput} from './UnsplashAssetSource.styled'

type UnsplashPhotoAlbumPhoto = PhotoType & {
  key: string
  data: UnsplashPhoto
}

type State = {
  query: string
  cursor: number
  key: number // Used to force remount of InfiniteScroll when query changes
}

const RESULTS_PER_PAGE = 42
const PHOTO_SPACING = 2
const PHOTO_PADDING = 1 // offset the 1px border width

export default function UnsplashAssetSource(props: AssetSourceComponentProps) {
  const client = useClient({apiVersion: '2022-09-01'})
  return <UnsplashAssetSourceInternal {...props} client={client} />
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
    key: 0,
  }

  allPhotos: UnsplashPhoto[] = []

  handleSelect = (photo: UnsplashPhoto) => {
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
    // Reset allPhotos when search changes
    this.allPhotos.length = 0
    this.setState((prev) => ({
      query,
      cursor: 0,
      key: prev.key + 1, // Force remount of InfiniteScroll
    }))
  }

  handleSearchTermCleared = () => {
    // Reset allPhotos when clearing search
    this.allPhotos.length = 0
    this.setState((prev) => ({
      query: '',
      cursor: 0,
      key: prev.key + 1, // Force remount of InfiniteScroll
    }))
  }

  fetchPhotos = async (index: number): Promise<UnsplashPhotoAlbumPhoto[] | null> => {
    try {
      const page = index + 1
      const query = this.state.query

      let results: UnsplashPhoto[]

      if (query) {
        const response = await this.props.client.request<{
          results: UnsplashPhoto[]
          total: number
          total_pages: number
        }>({
          url: `/addons/unsplash/search/photos?query=${encodeURIComponent(
            query,
          )}&page=${page}&per_page=${RESULTS_PER_PAGE}`,
          withCredentials: true,
          method: 'GET',
        })
        results = response.results
      } else {
        results = await this.props.client.request<UnsplashPhoto[]>({
          url: `/addons/unsplash/photos?order_by=popular&page=${page}&per_page=${RESULTS_PER_PAGE}`,
          withCredentials: true,
          method: 'GET',
        })
      }

      if (results.length === 0) {
        return null
      }

      // Store photos for cursor navigation - push directly to array for efficiency
      this.allPhotos.push(...results)

      return results.map((photo: UnsplashPhoto) => ({
        src: photo.urls.small,
        width: photo.width,
        height: photo.height,
        key: photo.id,
        data: photo,
      }))
    } catch (error) {
      // InfiniteScroll will handle showing no results when null is returned
      return null
    }
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const {cursor} = this.state
    if ((event.keyCode === 38 || event.keyCode === 37) && cursor > 0) {
      this.setState((prevState) => ({
        cursor: prevState.cursor - 1,
      }))
    } else if (
      (event.keyCode === 40 || event.keyCode === 39) &&
      cursor < this.allPhotos.length - 1
    ) {
      this.setState((prevState) => ({
        cursor: prevState.cursor + 1,
      }))
    }
  }

  updateCursor = (photo: UnsplashPhoto) => {
    const index = this.allPhotos.findIndex((result: UnsplashPhoto) => result.id === photo.id)
    this.setState({cursor: index})
  }

  renderImage = (props: RenderPhotoProps<UnsplashPhotoAlbumPhoto>) => {
    const {photo, layout} = props
    const active =
      this.allPhotos.findIndex((result: UnsplashPhoto) => result.id === photo.data.id) ===
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
    const {query, key} = this.state

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
          <div style={{height: '60vh', overflow: 'auto'}}>
            <InfiniteScroll
              key={key}
              fetch={this.fetchPhotos}
              loading={
                <Flex align="center" justify="center" padding={3}>
                  <Spinner muted />
                </Flex>
              }
              finished={
                <Text size={1} muted>
                  No more results
                </Text>
              }
            >
              <PhotoAlbum
                layout="rows"
                spacing={PHOTO_SPACING}
                padding={PHOTO_PADDING}
                targetRowHeight={(width) => {
                  if (width < 300) return 150
                  if (width < 600) return 200
                  return 300
                }}
                renderPhoto={this.renderImage}
              />
            </InfiniteScroll>
          </div>
        </Stack>
      </Dialog>
    )
  }
}
