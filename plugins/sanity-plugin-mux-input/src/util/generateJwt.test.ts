import {generateKeyPairSync, verify} from 'node:crypto'

import type {SanityClient} from 'sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {generateJwtAsync, signJwt} from './generateJwt'

function decode(token: string) {
  const [header = '', payload = '', signature = ''] = token.split('.')
  return {
    header: JSON.parse(Buffer.from(header, 'base64url').toString()),
    payload: JSON.parse(Buffer.from(payload, 'base64url').toString()),
    signingInput: `${header}.${payload}`,
    signature: Buffer.from(signature, 'base64url'),
  }
}

function createKeyPair(type: 'pkcs1' | 'pkcs8') {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: {type, format: 'pem'},
    publicKeyEncoding: {type: 'spki', format: 'pem'},
  })
}

describe('signJwt', () => {
  test.each(['pkcs1', 'pkcs8'] as const)(
    'signs an RS256 token that verifies with the %s public key',
    {timeout: 30_000},
    async (type) => {
      const {privateKey, publicKey} = createKeyPair(type)
      const token = await signJwt({time: 4, aud: 't', sub: 'playback-id'}, privateKey, 'key-id')
      const {header, payload, signingInput, signature} = decode(token)

      expect(header).toEqual({alg: 'RS256', typ: 'JWT', kid: 'key-id'})
      expect(payload).toEqual({time: 4, aud: 't', sub: 'playback-id'})
      expect(verify('RSA-SHA256', Buffer.from(signingInput), publicKey, signature)).toBe(true)
    },
  )
})

describe('generateJwtAsync', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test(
    'caches tokens per playback id, audience and payload for an hour',
    {timeout: 30_000},
    async () => {
      vi.useFakeTimers({toFake: ['Date']})
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

      const {privateKey, publicKey} = createKeyPair('pkcs1')
      const client = {
        config: () => ({projectId: 'jwt-test', dataset: 'production'}),
        fetch: async () => ({signingKeyId: 'key-id', signingKeyPrivate: btoa(privateKey)}),
      } as unknown as SanityClient

      const token = await generateJwtAsync(client, 'playback-id', 't', {time: 4, width: undefined})
      const {payload, signingInput, signature} = decode(token)
      expect(payload).toEqual({
        time: 4,
        exp: Date.parse('2026-01-01T12:00:00Z') / 1000,
        aud: 't',
        sub: 'playback-id',
      })
      expect(verify('RSA-SHA256', Buffer.from(signingInput), publicKey, signature)).toBe(true)

      vi.setSystemTime(new Date('2026-01-01T00:59:00Z'))
      expect(await generateJwtAsync(client, 'playback-id', 't', {time: 4})).toBe(token)
      expect(await generateJwtAsync(client, 'playback-id', 'v')).not.toBe(token)
      expect(await generateJwtAsync(client, 'other-playback-id', 't', {time: 4})).not.toBe(token)

      vi.setSystemTime(new Date('2026-01-01T01:00:00Z'))
      const nextToken = await generateJwtAsync(client, 'playback-id', 't', {time: 4})
      expect(decode(nextToken).payload.exp).toBe(Date.parse('2026-01-01T13:00:00Z') / 1000)
    },
  )
})
