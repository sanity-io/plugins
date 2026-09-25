import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, render, renderHook, screen, waitFor} from '@testing-library/react'
import {useSelector} from '@xstate/react'
import {type ReactNode, type RefObject, StrictMode} from 'react'
import type {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {imageAsset} from '../__tests__/fixtures/documents'
import {createMediaFetchMock, type MediaFixtures} from '../__tests__/fixtures/mediaFetchMock'
import {createMockSanityClient} from '../__tests__/fixtures/mockSanityClient'
import {CaptureActors} from '../__tests__/fixtures/renderWithMedia'
import {selectPickedAssets} from '../machines/assetsMachine'
import type {MediaMode} from '../machines/mediaMachine'
import {
  type MediaActors,
  MediaActorsProvider,
  useMediaActors,
  useMediaClient,
  useMediaConfig,
} from './MediaActorsContext'

const studioTheme = buildTheme()

function PickedCount() {
  const {assets} = useMediaActors()
  const count = useSelector(assets, (snapshot) => selectPickedAssets(snapshot).length)
  return <span>{count} picked</span>
}

function setup({
  fixtures = {assets: [imageAsset('a1')]},
  mode = {type: 'browser', mediaTagNames: []},
}: {fixtures?: MediaFixtures; mode?: MediaMode} = {}) {
  const client = createMockSanityClient({fetch: createMediaFetchMock(fixtures)})
  const actorsRef: RefObject<MediaActors | null> = {current: null}
  const Tree = ({children, onClose}: {children?: ReactNode; onClose?: () => void}) => (
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <MediaActorsProvider
          assetTypes={['image']}
          client={client}
          excludeTagSlugs={[]}
          mode={mode}
          onClose={onClose}
          selectedAssetIds={['a1']}
          showMediaLibraryAssets
        >
          <CaptureActors ref={actorsRef} />
          {children}
        </MediaActorsProvider>
      </ToastProvider>
    </ThemeProvider>
  )
  const listeners = () => client.listen.mock.results.map(({value}) => value as Subject<unknown>)
  const getActors = () => {
    if (!actorsRef.current) {
      throw new Error('The media actors were not rendered')
    }
    return actorsRef.current
  }
  return {Tree, client, getActors, listeners}
}

describe('MediaActorsProvider', () => {
  it('runs the media actors while it is mounted', async () => {
    const {Tree, getActors, listeners} = setup()
    const {unmount} = render(<Tree />)
    const {assets} = getActors()
    await waitFor(() => expect(assets.getSnapshot().context.allIds).toEqual(['a1']))
    expect(listeners().every((listener) => listener.observed)).toBe(true)

    unmount()
    act(() => assets.send({type: 'pick.toggle', assetId: 'a1'}))

    expect(listeners().some((listener) => listener.observed)).toBe(false)
    expect(selectPickedAssets(assets.getSnapshot())).toEqual([])
  })

  it('keeps working through the remounts of strict mode', async () => {
    const {Tree, client, getActors, listeners} = setup()
    // Strict mode only remounts the effects of new components below it when it wraps the root
    render(
      <StrictMode>
        <Tree>
          <PickedCount />
        </Tree>
      </StrictMode>,
    )
    const {assets, folders, tags} = getActors()
    await waitFor(() => {
      expect(assets.getSnapshot().context.allIds).toEqual(['a1'])
      expect(folders.getSnapshot().context.fetchCount).toBe(0)
      expect(tags.getSnapshot().context.fetchCount).toBe(0)
    })

    act(() => assets.send({type: 'pick.toggle', assetId: 'a1'}))

    expect(screen.getByText('1 picked')).toBeInTheDocument()
    // The remount aborted the first requests and sent them again
    const signals = client.fetch.mock.calls.map(([, , options]) => options.signal as AbortSignal)
    expect(signals.map((signal) => signal.aborted)).toEqual([true, true, true, false, false, false])
    expect(listeners().filter((listener) => listener.observed)).toHaveLength(3)
    expect(screen.queryByText(/An error occurred/)).not.toBeInTheDocument()
  })

  it('shows notifications as toasts', async () => {
    const {Tree} = setup({
      fixtures: {errors: {tags: {message: 'Tags unavailable', statusCode: 503}}},
    })

    render(<Tree />)

    expect(await screen.findByText('An error occurred: Tags unavailable')).toBeInTheDocument()
  })

  it('closes with the latest close handler', () => {
    const {Tree, getActors} = setup({mode: {type: 'editAsset', assetId: 'a1'}})
    const first = vi.fn()
    const second = vi.fn()
    const {rerender} = render(<Tree onClose={first} />)
    rerender(<Tree onClose={second} />)

    act(() => getActors().dialogs.send({type: 'dialog.close', id: 'a1'}))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('shares the configuration and client of the browser', () => {
    const {Tree, client} = setup()

    const {result} = renderHook(() => ({client: useMediaClient(), config: useMediaConfig()}), {
      wrapper: Tree,
    })

    expect(result.current.config).toEqual({
      assetTypes: ['image'],
      document: undefined,
      selectedAssetIds: ['a1'],
    })
    expect(result.current.client).toBe(client)
  })

  it('cannot be used outside of the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => renderHook(() => useMediaActors())).toThrow(
      'useMediaActors must be used within a MediaActorsProvider',
    )
  })
})
