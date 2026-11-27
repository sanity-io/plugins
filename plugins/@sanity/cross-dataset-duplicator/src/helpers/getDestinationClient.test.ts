import type {SanityClient} from '@sanity/client'
import type {AuthState, AuthStore} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {getDestinationClient} from './getDestinationClient'

type ClientConfig = {projectId: string; dataset?: string; apiVersion?: string; token?: string}

function createClient(config: ClientConfig): SanityClient {
  const client = {
    config: () => config,
    withConfig: (next: Partial<ClientConfig>) => createClient({...config, ...next}),
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only config() and withConfig() are called
  return client as unknown as SanityClient
}

// Minimal auth store whose `state` emits synchronously on subscribe, like the
// Studio's replayed auth state
function createAuth(state: Partial<AuthState>) {
  const unsubscribe = vi.fn()
  const store = {
    state: {
      subscribe: ({next}: {next: (value: AuthState) => void}) => {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only authenticated and client are read
        next(state as AuthState)
        return {unsubscribe}
      },
    },
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only state.subscribe() is called
  const auth = store as unknown as AuthStore

  return {auth, unsubscribe}
}

const originClient = createClient({
  projectId: 'projA',
  dataset: 'production',
  token: 'projA-token',
})

describe('getDestinationClient', () => {
  test('re-points the origin client for a destination in the same project', async () => {
    const {auth} = createAuth({authenticated: false})
    const client = await getDestinationClient({
      originClient,
      destination: {projectId: 'projA', dataset: 'staging', auth},
      apiVersion: '2025-02-19',
    })

    expect(client?.config()).toEqual({
      projectId: 'projA',
      dataset: 'staging',
      apiVersion: '2025-02-19',
      token: 'projA-token',
    })
  })

  test("uses the destination workspace's client for a destination in another project", async () => {
    const {auth, unsubscribe} = createAuth({
      authenticated: true,
      client: createClient({projectId: 'projB', dataset: 'production', token: 'projB-token'}),
    })
    const client = await getDestinationClient({
      originClient,
      destination: {projectId: 'projB', dataset: 'staging', auth},
      apiVersion: '2025-02-19',
    })

    expect(client?.config()).toEqual({
      projectId: 'projB',
      dataset: 'staging',
      apiVersion: '2025-02-19',
      token: 'projB-token',
    })

    await Promise.resolve()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  test('returns null when not logged in to a destination in another project', async () => {
    const {auth} = createAuth({
      authenticated: false,
      client: createClient({projectId: 'projB'}),
    })
    const client = await getDestinationClient({
      originClient,
      destination: {projectId: 'projB', dataset: 'production', auth},
    })

    expect(client).toBeNull()
  })
})
