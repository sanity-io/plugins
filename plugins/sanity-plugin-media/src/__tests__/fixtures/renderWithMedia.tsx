import type {SanityDocument} from '@sanity/client'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {render, type RenderResult, waitFor} from '@testing-library/react'
import type {ReactElement} from 'react'
import {type AssetSourceComponentProps, ColorSchemeProvider} from 'sanity'
import {vi} from 'vitest'

import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import {
  type MediaActors,
  MediaActorsProvider,
  useMediaActors,
} from '../../contexts/MediaActorsContext'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import type {MediaMode} from '../../machines/mediaMachine'
import type {AssetType, MediaToolOptions} from '../../types'
import {createMediaFetchMock, type MediaFixtures} from './mediaFetchMock'
import {createMockSanityClient, type MockSanityClient} from './mockSanityClient'

const studioTheme = buildTheme()

type Options = MediaFixtures & {
  assetTypes?: AssetType[]
  client?: ReturnType<typeof createMockSanityClient>
  document?: SanityDocument
  isMultiSelect?: boolean
  mode?: MediaMode
  onClose?: () => void
  onSelect?: AssetSourceComponentProps['onSelect']
  selectedAssetIds?: string[]
  toolOptions?: Partial<MediaToolOptions>
}

export type RenderWithMediaResult = RenderResult & {
  actors: MediaActors
  client: MockSanityClient
}

/**
 * Renders `ui` inside a running media actor whose client serves the given fixtures, and resolves
 * once the initial assets, tags and folders are loaded.
 */
export async function renderWithMedia(
  ui: ReactElement,
  options: Options = {},
): Promise<RenderWithMediaResult> {
  const {
    assetTypes = ['file', 'image'],
    document,
    isMultiSelect,
    mode = {type: 'browser', mediaTagNames: []},
    onClose = vi.fn(),
    onSelect,
    selectedAssetIds = [],
    toolOptions,
  } = options
  const client = options.client ?? createMockSanityClient({fetch: createMediaFetchMock(options)})

  const toolOptionsValue: MediaToolOptions = {
    creditLine: {enabled: false},
    directUploads: true,
    ...toolOptions,
  }

  let actors: MediaActors | undefined
  const CaptureActors = () => {
    actors = useMediaActors()
    return null
  }

  const result = render(
    <ColorSchemeProvider scheme="light">
      <ToolOptionsProvider options={toolOptionsValue}>
        <ThemeProvider theme={studioTheme}>
          <ToastProvider>
            <MediaActorsProvider
              assetTypes={assetTypes}
              client={client}
              document={document}
              excludeTagSlugs={toolOptionsValue.excludeTags ?? []}
              mode={mode}
              onClose={onClose}
              selectedAssetIds={selectedAssetIds}
              showMediaLibraryAssets={toolOptionsValue.showMediaLibraryAssets ?? true}
            >
              <AssetBrowserDispatchProvider isMultiSelect={isMultiSelect} onSelect={onSelect}>
                <CaptureActors />
                {ui}
              </AssetBrowserDispatchProvider>
            </MediaActorsProvider>
          </ToastProvider>
        </ThemeProvider>
      </ToolOptionsProvider>
    </ColorSchemeProvider>,
  )

  if (!actors) {
    throw new Error('The media actors were not rendered')
  }
  const {assets, folders, tags} = actors
  if (mode.type === 'browser' || mode.assetId) {
    await waitFor(() => {
      if (
        assets.getSnapshot().context.fetchCount < 0 ||
        !assets.getSnapshot().matches({fetch: 'idle'}) ||
        folders.getSnapshot().context.fetchCount < 0 ||
        tags.getSnapshot().context.fetchCount < 0
      ) {
        throw new Error('The media actors are still loading')
      }
    })
  }

  return {...result, actors, client}
}
