import type {SanityClient} from '@sanity/client'
import {Subject, of} from 'rxjs'
import {vi} from 'vitest'

export type MockSanityClient = {
  observable: {
    fetch: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    assets: {upload: ReturnType<typeof vi.fn>}
  }
  fetch: ReturnType<typeof vi.fn>
  listen: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  transaction: ReturnType<typeof vi.fn>
}

export function createMockSanityClient(
  overrides: Partial<Omit<MockSanityClient, 'observable'>> & {
    observable?: Partial<MockSanityClient['observable']> & {
      assets?: Partial<MockSanityClient['observable']['assets']>
    }
  } = {},
): SanityClient {
  const {observable: observableOverrides, ...restOverrides} = overrides

  const observableBase: MockSanityClient['observable'] = {
    fetch: vi.fn(() => of({items: []})),
    delete: vi.fn(() => of({})),
    create: vi.fn(() => of({_id: 'new'})),
    assets: {
      upload: vi.fn(() => of({type: 'complete', body: {document: {_id: 'up'}}})),
    },
  }

  const observable: MockSanityClient['observable'] = {
    ...observableBase,
    ...observableOverrides,
    assets: {
      ...observableBase.assets,
      ...observableOverrides?.assets,
    },
  }

  const client: MockSanityClient = {
    observable,
    fetch: vi.fn(() => Promise.resolve(0)),
    listen: vi.fn(() => new Subject()),
    patch: vi.fn(),
    transaction: vi.fn(),
    ...restOverrides,
  }

  return client as unknown as SanityClient
}

export function mockPatchChain(result: unknown): {
  append: ReturnType<typeof vi.fn>
  ifRevisionId: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
  setIfMissing: ReturnType<typeof vi.fn>
  unset: ReturnType<typeof vi.fn>
  commit: ReturnType<typeof vi.fn>
} {
  const commit = vi.fn().mockResolvedValue(result)
  const chain = {
    append: vi.fn(),
    ifRevisionId: vi.fn(),
    set: vi.fn(),
    setIfMissing: vi.fn(),
    unset: vi.fn(),
    commit,
  }
  chain.append.mockImplementation(() => chain)
  chain.ifRevisionId.mockImplementation(() => chain)
  chain.set.mockImplementation(() => chain)
  chain.setIfMissing.mockImplementation(() => chain)
  chain.unset.mockImplementation(() => chain)
  return chain
}

export function mockTransactionCommit(resolved?: unknown): {
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  commit: ReturnType<typeof vi.fn>
  patchChain: ReturnType<typeof mockPatchChain>
} {
  const patchChain = mockPatchChain(resolved)
  const tx = {
    patch: vi.fn((_id: string, ops?: (patch: typeof patchChain) => unknown) => {
      if (typeof ops === 'function') {
        ops(patchChain)
      }
      return tx
    }),
    delete: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue(resolved),
    patchChain,
  }
  return tx
}
