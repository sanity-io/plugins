import {type Store} from '@reduxjs/toolkit'
import {act, cleanup, render} from '@testing-library/react'
import {Activity, StrictMode, useEffect} from 'react'
import {useStore} from 'react-redux'
import {of, Subject} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../__tests__/fixtures/mockSanityClient'
import {assetsActions} from '../../modules/assets'
import ReduxProvider from './index'

function StoreProbe({onStore}: {onStore: (store: Store) => void}) {
  const store = useStore()
  useEffect(() => {
    onStore(store)
  }, [onStore, store])
  return null
}

/** A client whose `listen()` hands out one shared subject, so its subscription can be inspected. */
function createClient() {
  const fetch = vi.fn(() => of({items: []}))
  const listener = new Subject()
  const client = createMockSanityClient({
    observable: {fetch},
    listen: vi.fn(() => listener),
  })
  return {client, fetch, listener}
}

function dispatchFetch(store: Store) {
  store.dispatch(
    assetsActions.fetchRequest({
      params: {},
      queryFilter: '_type == "sanity.imageAsset"',
      selector: '',
      sort: '',
    }),
  )
}

describe('ReduxProvider store lifecycle', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps epics listening after a React strict-mode remount', async () => {
    const fetch = vi.fn(() => of({items: []}))
    const client = createMockSanityClient({
      observable: {fetch},
    })
    let store: Store | undefined

    render(
      <StrictMode>
        <ReduxProvider client={client}>
          <StoreProbe
            onStore={(next) => {
              store = next
            }}
          />
        </ReduxProvider>
      </StrictMode>,
    )

    expect(store).toBeDefined()
    dispatchFetch(store!)

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(store!.getState().assets.fetching).toBe(false)
    })
  })

  it('keeps the epics running while an Activity boundary hides the browser', async () => {
    const {client, fetch, listener} = createClient()
    let store: Store | undefined

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <ReduxProvider client={client}>
          <StoreProbe
            onStore={(next) => {
              store = next
            }}
          />
        </ReduxProvider>
      </Activity>
    )
    const {rerender} = render(tree('visible'))

    expect(store).toBeDefined()
    store!.dispatch(assetsActions.listenRequest())
    expect(listener.observed).toBe(true)

    rerender(tree('hidden'))
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0)
      })
    })
    expect(listener.observed).toBe(true)

    // Child effects dispatch their fetches again when the tool is shown
    rerender(tree('visible'))
    dispatchFetch(store!)

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(store!.getState().assets.fetching).toBe(false)
    })
  })

  it('ends the epics when a hidden browser is unmounted', async () => {
    const {client, fetch, listener} = createClient()
    let store: Store | undefined

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <ReduxProvider client={client}>
          <StoreProbe
            onStore={(next) => {
              store = next
            }}
          />
        </ReduxProvider>
      </Activity>
    )
    const {rerender, unmount} = render(tree('visible'))
    store!.dispatch(assetsActions.listenRequest())
    expect(listener.observed).toBe(true)
    rerender(tree('hidden'))

    // React does not run the hidden tree's effect cleanups again on unmount, so the end comes
    // from watching the DOM; MutationObserver callbacks are delivered as microtasks
    unmount()
    await act(async () => {
      await Promise.resolve()
    })

    expect(listener.observed).toBe(false)
    dispatchFetch(store!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(store!.getState().assets.fetching).toBe(true)
  })

  it('ends the epics after a real unmount', async () => {
    const {client, fetch, listener} = createClient()
    let store: Store | undefined

    const {unmount} = render(
      <ReduxProvider client={client}>
        <StoreProbe
          onStore={(next) => {
            store = next
          }}
        />
      </ReduxProvider>,
    )

    expect(store).toBeDefined()
    store!.dispatch(assetsActions.listenRequest())
    expect(listener.observed).toBe(true)
    unmount()

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0)
      })
    })

    expect(listener.observed).toBe(false)
    dispatchFetch(store!)

    await act(async () => {
      await Promise.resolve()
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(store!.getState().assets.fetching).toBe(true)
  })
})
