import type {ReactNode} from 'react'

import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {vi, type Mock} from 'vitest'

type MockPatch = {
  set: Mock<() => MockPatch>
  setIfMissing: Mock<() => MockPatch>
  unset: Mock<() => MockPatch>
  insert: Mock<() => MockPatch>
  commit: Mock<() => Promise<unknown>>
}

type MockTransaction = {
  create: Mock<() => MockTransaction>
  createIfNotExists: Mock<() => MockTransaction>
  createOrReplace: Mock<() => MockTransaction>
  patch: Mock<() => MockTransaction>
  delete: Mock<() => MockTransaction>
  commit: Mock<() => Promise<unknown>>
}

export type MockSanityClient = {
  fetch: Mock<() => Promise<unknown>>
  patch: Mock<(id: string) => MockPatch>
  transaction: Mock<() => MockTransaction>
  listen: Mock<() => {subscribe: Mock}>
  withConfig: Mock<() => MockSanityClient>
}

/**
 * Wrapper component that provides @sanity/ui ThemeProvider for component tests.
 * All components rendering @sanity/ui elements need this.
 */
export function ThemeWrapper({children}: {children: ReactNode}) {
  const theme = buildTheme()
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

/**
 * Creates a mock Sanity client with configurable responses.
 */
export function createMockSanityClient(
  responses: {
    fetch?: unknown
    patch?: unknown
    transaction?: unknown
  } = {},
): MockSanityClient {
  const mockPatch = {
    set: vi.fn().mockReturnThis(),
    setIfMissing: vi.fn().mockReturnThis(),
    unset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue(responses.patch ?? {}),
  } as unknown as MockPatch

  const mockTransaction = {
    create: vi.fn().mockReturnThis(),
    createIfNotExists: vi.fn().mockReturnThis(),
    createOrReplace: vi.fn().mockReturnThis(),
    patch: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue(responses.transaction ?? {}),
  } as unknown as MockTransaction

  return {
    fetch: vi.fn().mockResolvedValue(responses.fetch ?? null),
    patch: vi.fn().mockReturnValue(mockPatch),
    transaction: vi.fn().mockReturnValue(mockTransaction),
    listen: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
    withConfig: vi.fn().mockReturnThis(),
  }
}
