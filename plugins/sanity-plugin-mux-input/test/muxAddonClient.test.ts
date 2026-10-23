import {createClient} from '@sanity/client'
import {afterEach, describe, expect, test} from 'vitest'

import {getMuxAddonClient, normalizeMuxApiHost, withMuxApiHost} from '../src/util/muxAddonClient'

type CapturedRequest = {url: string; headers: Record<string, string>; credentials?: string}

const requests: CapturedRequest[] = []

// `resolveFetch` is an internal @sanity/client option that replaces the transport,
// so these tests never reach the network.
function fakeFetch(input: string, init?: {headers?: HeadersInit; credentials?: string}) {
  requests.push({
    url: input,
    headers: Object.fromEntries(new Headers(init?.headers)),
    credentials: init?.credentials,
  })
  return Promise.resolve(
    new Response('{}', {status: 200, headers: {'content-type': 'application/json'}}),
  )
}

function studioClient(config: {token?: string} = {}) {
  return createClient({
    projectId: 'abc123',
    dataset: 'production',
    apiVersion: '2024-03-05',
    useCdn: false,
    withCredentials: !config.token,
    ignoreBrowserTokenWarning: true,
    resolveFetch: () => fakeFetch,
    ...config,
  })
}

afterEach(() => {
  requests.length = 0
})

describe('normalizeMuxApiHost', () => {
  test('strips a trailing slash', () => {
    expect(normalizeMuxApiHost('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080')
    expect(normalizeMuxApiHost('http://abc123.example.test:8000')).toBe(
      'http://abc123.example.test:8000',
    )
  })

  test('rejects values that are not a bare http(s) origin', () => {
    expect(() => normalizeMuxApiHost('ws://127.0.0.1:8080')).toThrow(/http or https/)
    expect(() => normalizeMuxApiHost('127.0.0.1:8080')).toThrow(/absolute URL/)
    expect(() => normalizeMuxApiHost('http://127.0.0.1:8080/v2024-03-05')).toThrow(/path/)
  })
})

describe('getMuxAddonClient', () => {
  test('returns the same client when no override is set', () => {
    const client = studioClient()
    expect(getMuxAddonClient(client)).toBe(client)
  })

  test('uses the override host only for addon requests', () => {
    const client = withMuxApiHost(studioClient(), 'http://127.0.0.1:8080')
    const addon = getMuxAddonClient(client)

    expect(addon).not.toBe(client)
    expect(client.getUrl('/addons/mux')).toBe('https://abc123.api.sanity.io/v2024-03-05/addons/mux')
    expect(addon.getUrl('/addons/mux')).toBe('http://127.0.0.1:8080/v2024-03-05/addons/mux')
    expect(addon.config()).toMatchObject({
      apiHost: 'http://127.0.0.1:8080',
      useProjectHostname: false,
      projectId: 'abc123',
      dataset: 'production',
    })
  })

  test('sends the project id header and the Studio token to the override host', async () => {
    const client = withMuxApiHost(studioClient({token: 'sk-test'}), 'http://127.0.0.1:8080')

    await getMuxAddonClient(client).request({
      url: '/addons/mux/secrets/production/test',
      withCredentials: true,
    })

    expect(requests).toHaveLength(1)
    const [request] = requests
    expect(request!.url).toBe(
      'http://127.0.0.1:8080/v2024-03-05/addons/mux/secrets/production/test',
    )
    expect(request!.headers['x-sanity-project-id']).toBe('abc123')
    expect(request!.headers['authorization']).toBe('Bearer sk-test')
  })

  test('keeps the default project hostname request when no override is set', async () => {
    const client = studioClient()

    await getMuxAddonClient(client).request({
      url: '/addons/mux/secrets/production/test',
      withCredentials: true,
    })

    expect(requests).toHaveLength(1)
    const [request] = requests
    expect(request!.url).toBe(
      'https://abc123.api.sanity.io/v2024-03-05/addons/mux/secrets/production/test',
    )
    expect(request!.headers['x-sanity-project-id']).toBeUndefined()
    expect(request!.credentials).toBe('include')
  })
})
