import {type Store} from '@reduxjs/toolkit'
import {act, cleanup, render} from '@testing-library/react'
import {StrictMode, useEffect} from 'react'
import {useStore} from 'react-redux'
import {of} from 'rxjs'
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

  it('ends the epics after a real unmount', async () => {
    const fetch = vi.fn(() => of({items: []}))
    const client = createMockSanityClient({
      observable: {fetch},
    })
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
    unmount()

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0)
      })
    })

    dispatchFetch(store!)

    await act(async () => {
      await Promise.resolve()
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(store!.getState().assets.fetching).toBe(true)
  })
})
