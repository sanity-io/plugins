import type {SanityDocument} from '@sanity/client'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, render, type RenderResult, waitFor} from '@testing-library/react'
import {type ReactElement, type Ref, type RefObject, useImperativeHandle} from 'react'
import {type AssetSourceComponentProps, ColorSchemeProvider} from 'sanity'
import {vi} from 'vitest'

import Dialogs from '../../components/Dialogs'
import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import {
  type MediaActors,
  MediaActorsProvider,
  useMediaActors,
} from '../../contexts/MediaActorsContext'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import type {MediaMode} from '../../machines/mediaMachine'
import type {AssetType, Dialog, MediaToolOptions} from '../../types'
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

/** Exposes the actors of the surrounding `MediaActorsProvider` through `ref`. */
export function CaptureActors({ref}: {ref: Ref<MediaActors>}) {
  const actors = useMediaActors()
  useImperativeHandle(ref, () => actors, [actors])
  return null
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

  const actorsRef: RefObject<MediaActors | null> = {current: null}

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
                <CaptureActors ref={actorsRef} />
                {ui}
              </AssetBrowserDispatchProvider>
            </MediaActorsProvider>
          </ToastProvider>
        </ThemeProvider>
      </ToolOptionsProvider>
    </ColorSchemeProvider>,
  )

  const actors = actorsRef.current
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

/** Renders the dialog stack, and opens `dialog` in it once the media actors are loaded. */
export async function renderDialog(
  dialog: Dialog,
  options: Options = {},
): Promise<RenderWithMediaResult> {
  const result = await renderWithMedia(<Dialogs />, options)
  act(() => result.actors.dialogs.send({type: 'dialog.open', dialog}))
  return result
}
