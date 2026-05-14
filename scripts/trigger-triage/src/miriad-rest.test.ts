import {afterEach, describe, expect, test, vi} from 'vitest'

import {MiriadRestClient} from './miriad-rest.ts'

describe('MiriadRestClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('ensureChannel returns an existing channel without creating', async () => {
    const calls = mockFetch([{body: [channel({id: 'existing'})]}])
    const client = miriadClient()

    const result = await client.ensureChannel('plugins-issue-660')

    expect(result.id).toBe('existing')
    expect(calls).toEqual([
      {
        url: 'https://miriad.example/spaces/space/channels',
        method: 'GET',
        body: undefined,
      },
    ])
  })

  test('ensureChannel creates a missing channel', async () => {
    const calls = mockFetch([{body: []}, {body: channel({id: 'created'})}])
    const client = miriadClient()

    const result = await client.ensureChannel('plugins-issue-660')

    expect(result.id).toBe('created')
    expect(calls).toEqual([
      {
        url: 'https://miriad.example/spaces/space/channels',
        method: 'GET',
        body: undefined,
      },
      {
        url: 'https://miriad.example/spaces/space/channels',
        method: 'POST',
        body: '{"name":"plugins-issue-660"}',
      },
    ])
  })

  test('ensureChannel tolerates create conflicts by rereading', async () => {
    const calls = mockFetch([
      {body: []},
      {status: 409, body: {message: 'conflict'}},
      {body: [channel({id: 'winner'})]},
    ])
    const client = miriadClient()

    const result = await client.ensureChannel('plugins-issue-660')

    expect(result.id).toBe('winner')
    expect(calls.map((call) => call.method)).toEqual(['GET', 'POST', 'GET'])
  })

  test('addAgent tolerates duplicate assignment conflicts', async () => {
    const calls = mockFetch([{status: 409, body: {message: 'conflict'}}])
    const client = miriadClient()

    const result = await client.addAgent('channel-id', 'triager')

    expect(result).toBeNull()
    expect(calls).toEqual([
      {
        url: 'https://miriad.example/channels/channel-id/agents',
        method: 'POST',
        body: '{"name":"triager"}',
      },
    ])
  })

  test('archiveChannel posts to the archive endpoint', async () => {
    const calls = mockFetch([{body: channel({id: 'channel-id', archived: true})}])
    const client = miriadClient()

    const result = await client.archiveChannel('channel-id')

    expect(result.archived).toBe(true)
    expect(calls).toEqual([
      {
        url: 'https://miriad.example/channels/channel-id/archive',
        method: 'POST',
        body: undefined,
      },
    ])
  })
})

interface FetchCall {
  url: string
  method: string
  body: BodyInit | null | undefined
}

interface MockResponse {
  status?: number | undefined
  body?: unknown
}

function mockFetch(responses: MockResponse[]): FetchCall[] {
  const calls: FetchCall[] = []

  const fetchMock: typeof fetch = async (input, init) => {
    calls.push({
      url: inputToUrl(input),
      method: init?.method ?? 'GET',
      body: init?.body,
    })

    const response = responses.shift()
    if (!response) throw new Error('No mock response')

    return new Response(response.body === undefined ? null : JSON.stringify(response.body), {
      status: response.status ?? 200,
    })
  }

  vi.stubGlobal('fetch', fetchMock)
  return calls
}

function inputToUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function miriadClient(): MiriadRestClient {
  return new MiriadRestClient({
    url: 'https://miriad.example',
    token: 'token',
    spaceId: 'space',
  })
}

function channel(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'channel-id',
    name: 'plugins-issue-660',
    displayName: null,
    archived: false,
    ...overrides,
  }
}
