import type {SanityClient} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {type Mock, vi} from 'vitest'

export type MockPatchChain = {
  append: Mock
  commit: Mock
  ifRevisionId: Mock
  set: Mock
  setIfMissing: Mock
  unset: Mock
}

export type MockTransaction = {
  commit: Mock
  delete: Mock
  patch: Mock
  /** The chain passed to every `patch(id, ops)` callback. */
  patchChain: MockPatchChain
}

export type MockSanityClient = {
  create: Mock
  delete: Mock
  fetch: Mock
  listen: Mock
  observable: {
    assets: {upload: Mock}
    fetch: Mock
  }
  patch: Mock
  transaction: Mock
}

export function mockPatchChain(result?: unknown): MockPatchChain {
  const chain: MockPatchChain = {
    append: vi.fn(),
    commit: vi.fn(() => Promise.resolve(result)),
    ifRevisionId: vi.fn(),
    set: vi.fn(),
    setIfMissing: vi.fn(),
    unset: vi.fn(),
  }
  chain.append.mockReturnValue(chain)
  chain.ifRevisionId.mockReturnValue(chain)
  chain.set.mockReturnValue(chain)
  chain.setIfMissing.mockReturnValue(chain)
  chain.unset.mockReturnValue(chain)
  return chain
}

export function mockTransaction(result?: unknown): MockTransaction {
  const patchChain = mockPatchChain(result)
  const transaction: MockTransaction = {
    commit: vi.fn(() => Promise.resolve(result)),
    delete: vi.fn(),
    patch: vi.fn((_id: string, operations?: unknown) => {
      if (typeof operations === 'function') {
        operations(patchChain)
      }
      return transaction
    }),
    patchChain,
  }
  transaction.delete.mockReturnValue(transaction)
  return transaction
}

export function createMockSanityClient(
  overrides: Partial<Omit<MockSanityClient, 'observable'>> & {
    observable?: Partial<MockSanityClient['observable']>
  } = {},
): SanityClient & MockSanityClient {
  const {observable, ...rest} = overrides
  const client: MockSanityClient = {
    create: vi.fn((document: {_id?: string}) => Promise.resolve({_id: 'new', ...document})),
    delete: vi.fn(() => Promise.resolve({})),
    fetch: vi.fn(() => Promise.resolve([])),
    listen: vi.fn(() => new Subject()),
    patch: vi.fn(() => mockPatchChain({})),
    transaction: vi.fn(() => mockTransaction({})),
    ...rest,
    observable: {
      assets: {upload: vi.fn(() => of({type: 'response', body: {document: {_id: 'up'}}}))},
      fetch: vi.fn(() => of(null)),
      ...observable,
    },
  }
  return client as unknown as SanityClient & MockSanityClient
}

/** A promise that the test settles explicitly, to observe in-flight states. */
export function deferred<T = void>(): {
  promise: Promise<T>
  reject: (error: unknown) => void
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, reject, resolve}
}
