import {afterEach, describe, expect, it} from 'vitest'

import {hashFile} from './uploadSanityAsset'

describe('hashFile', () => {
  const cryptoRef = globalThis.crypto

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: cryptoRef,
      configurable: true,
      writable: true,
    })
  })

  it('rejects when Web Crypto is unavailable', async () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    await expect(hashFile(new File(['x'], 'blob.bin'))).rejects.toMatchObject({
      message: expect.stringMatching(/secure contexts/i),
      statusCode: 500,
    })
  })

  it('resolves to the hex encoded SHA-1 of the file contents', async () => {
    await expect(hashFile(new File(['hello'], 'hello.txt'))).resolves.toBe(
      'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
    )
  })
})
