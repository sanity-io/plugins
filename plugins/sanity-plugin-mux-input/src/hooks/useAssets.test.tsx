// @vitest-environment jsdom
import {act, render, screen} from '@testing-library/react'
import {Activity} from 'react'
import {Observable, Subject} from 'rxjs'
import {describe, expect, test, vi} from 'vitest'

import type {VideoAssetDocument} from '../util/types'
import useAssets from './useAssets'

const listenQuery = vi.fn()
const documentStore = {listenQuery}

vi.mock('sanity', () => ({
  useDocumentStore: () => documentStore,
  // What `collate` does for published documents, which is all this test hands it
  collate: (docs: VideoAssetDocument[]) => docs.map((doc) => ({id: doc._id, published: doc})),
}))

function Browser() {
  const {assets, isLoading} = useAssets()
  return (
    <div data-testid="browser">{isLoading ? 'loading' : assets.map((a) => a._id).join(',')}</div>
  )
}

function asset(id: string): VideoAssetDocument {
  return {_id: id, _type: 'mux.videoAsset', assetId: id} as VideoAssetDocument
}

describe('useAssets', () => {
  test('keeps the loaded videos when an Activity boundary hides and shows the browser', async () => {
    let subscriptions = 0
    const results = new Subject<VideoAssetDocument[]>()
    listenQuery.mockReturnValue(
      new Observable<VideoAssetDocument[]>((subscriber) => {
        subscriptions++
        const subscription = results.subscribe(subscriber)
        return () => subscription.unsubscribe()
      }),
    )

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Browser />
      </Activity>
    )
    const {rerender} = render(tree('visible'))
    expect(screen.getByTestId('browser').textContent).toBe('loading')

    act(() => results.next([asset('a'), asset('b')]))
    expect(screen.getByTestId('browser').textContent).toBe('a,b')
    expect(subscriptions).toBe(1)

    rerender(tree('hidden'))
    // react-rx releases the source a tick after the last subscriber leaves
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 10)
      })
    })
    rerender(tree('visible'))

    // The query reconnects, but the videos it already delivered stay on screen
    expect(subscriptions).toBe(2)
    expect(screen.getByTestId('browser').textContent).toBe('a,b')

    act(() => results.next([asset('a'), asset('b'), asset('c')]))
    expect(screen.getByTestId('browser').textContent).toBe('a,b,c')
  })
})
