import type {SanityClient} from 'sanity'
import {suspend} from 'suspend-react'

import {readSecrets} from './readSecrets'
import type {AnimatedThumbnailOptions, ThumbnailOptions} from './types'

export type Audience = 'g' | 's' | 't' | 'v' | 'd'

export type Payload<T extends Audience> = T extends 'g'
  ? AnimatedThumbnailOptions
  : T extends 's'
    ? never
    : T extends 't'
      ? ThumbnailOptions
      : T extends 'v'
        ? never
        : T extends 'd'
          ? never
          : never

const TOKEN_EXPIRES_IN_SECONDS = 12 * 60 * 60
// Signed tokens are reused for at most this long, so a cached token always has 11+ hours left
const TOKEN_CACHE_LIFESPAN = 60 * 60 * 1000

/**
 * Uses suspend. Call this with {@link tryWithSuspend} or rethrow the Promise
 */
export function generateJwt<T extends Audience>(
  client: SanityClient,
  playbackId: string,
  aud: T,
  payload?: Payload<T>,
): string {
  const {signingKeyId, signingKeyPrivate} = readSecrets(client)
  if (!signingKeyId) {
    throw new TypeError("Missing `signingKeyId`.\n Check your plugin's configuration")
  }
  if (!signingKeyPrivate) {
    throw new TypeError("Missing `signingKeyPrivate`.\n Check your plugin's configuration")
  }

  const claims: object = payload
    ? JSON.parse(JSON.stringify(payload, (_, v) => v ?? undefined))
    : {}

  /* Using suspend means we need to use Suspense on parent components.
  Also, this will throw a Promise under the hood (apparently common in React), 
  so if we want to catch errors we have to take this into account in catch blocks
  and rethrow promises. */
  return suspend(
    () =>
      signJwt(
        {
          ...claims,
          exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRES_IN_SECONDS,
          aud,
          sub: playbackId,
        },
        atob(signingKeyPrivate),
        signingKeyId,
      ),
    [
      'sanity-plugin-mux-input/jwt',
      signingKeyId,
      signingKeyPrivate,
      playbackId,
      aud,
      JSON.stringify(claims),
      Math.floor(Date.now() / TOKEN_CACHE_LIFESPAN),
    ],
    {lifespan: TOKEN_CACHE_LIFESPAN},
  )
}

/**
 * Same as {@link generateJwt}, for use outside of render (event handlers, async functions)
 */
export async function generateJwtAsync<T extends Audience>(
  client: SanityClient,
  playbackId: string,
  aud: T,
  payload?: Payload<T>,
): Promise<string> {
  try {
    return generateJwt(client, playbackId, aud, payload)
  } catch (errorOrPromise) {
    if (!(errorOrPromise instanceof Promise)) throw errorOrPromise
    await errorOrPromise
    return generateJwtAsync(client, playbackId, aud, payload)
  }
}

/**
 * Signs an RS256 JWT with WebCrypto. `privateKeyPem` may be PKCS#1 (`BEGIN RSA PRIVATE KEY`,
 * which is what Mux issues) or PKCS#8 (`BEGIN PRIVATE KEY`).
 */
export async function signJwt(
  payload: object,
  privateKeyPem: string,
  keyId: string,
): Promise<string> {
  const header = {alg: 'RS256', typ: 'JWT', kid: keyId}
  const signingInput = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    await importPrivateKey(privateKeyPem),
    new TextEncoder().encode(signingInput),
  )
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`
}

const privateKeys = new Map<string, Promise<CryptoKey>>()

function importPrivateKey(pem: string): Promise<CryptoKey> {
  let key = privateKeys.get(pem)
  if (!key) {
    const der = base64Decode(pem.replace(/-----[^-]+-----|\s/g, ''))
    key = crypto.subtle.importKey(
      'pkcs8',
      pem.includes('BEGIN RSA PRIVATE KEY') ? pkcs1ToPkcs8(der) : der,
      {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
      false,
      ['sign'],
    )
    privateKeys.set(pem, key)
  }
  return key
}

// DER for `version INTEGER 0` followed by the `rsaEncryption` AlgorithmIdentifier
const PKCS8_RSA_PREFIX = [
  0x02, 0x01, 0x00, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
  0x05, 0x00,
]

function pkcs1ToPkcs8(pkcs1: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const octetStringHeader = [0x04, ...derLength(pkcs1.length)]
  const header = [
    0x30,
    ...derLength(PKCS8_RSA_PREFIX.length + octetStringHeader.length + pkcs1.length),
    ...PKCS8_RSA_PREFIX,
    ...octetStringHeader,
  ]
  const pkcs8 = new Uint8Array(header.length + pkcs1.length)
  pkcs8.set(header)
  pkcs8.set(pkcs1, header.length)
  return pkcs8
}

function derLength(length: number): number[] {
  if (length < 0x80) return [length]
  const bytes: number[] = []
  for (let remaining = length; remaining > 0; remaining >>= 8) bytes.unshift(remaining & 0xff)
  return [0x80 | bytes.length, ...bytes]
}

function base64Decode(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

function base64UrlEncodeJson(value: object): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)))
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
