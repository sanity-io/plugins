/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {DEFAULT_CONFIG} from '../constants'
import {createMockSanityClient, ThemeWrapper} from '../test/component-helpers'
import {MOCK_LANGUAGES} from '../test/helpers'
import type {Language, PluginConfig} from '../types'
import {
  DocumentInternationalizationProvider,
  useDocumentInternationalizationContext,
} from './DocumentInternationalizationContext'

type ProviderPluginConfig = Required<Omit<PluginConfig, 'metadataInternationalization'>> &
  Pick<PluginConfig, 'metadataInternationalization'>

let mockClient: ReturnType<typeof createMockSanityClient>
const mockUseWorkspace = vi.fn(() => ({name: 'default'}))

// Track promises passed to React.use so we can assert async resolution wiring
const useSpy = vi.fn()

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    use: (usable: unknown) => {
      useSpy(usable)
      // For Thenables created by the provider, resolve synchronously for the test
      if (usable && typeof (usable as Promise<unknown>).then === 'function') {
        let result: Language[] | undefined
        let error: unknown
        let settled = false
        ;(usable as Promise<Language[]>).then(
          (value) => {
            result = value
            settled = true
            return undefined
          },
          (err: unknown) => {
            error = err
            settled = true
            return undefined
          },
        )
        // Microtask may not have run yet; return a sentinel via a sync cache if available
        const cached = (usable as {__testResult?: Language[]}).__testResult
        if (cached) return cached
        if (settled) {
          if (error) throw error
          return result
        }
        // Attach a sync result for subsequent renders after we flush
        throw usable
      }
      return actual.use(usable as never)
    },
  }
})

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: vi.fn(() => mockClient),
    useWorkspace: () => mockUseWorkspace(),
  }
})

function ContextReader() {
  const config = useDocumentInternationalizationContext()
  return (
    <div>
      <span data-testid="lang-count">{config.supportedLanguages.length}</span>
      <span data-testid="first-lang">{config.supportedLanguages[0]?.id ?? 'none'}</span>
      <span data-testid="schema-types">{config.schemaTypes.join(',')}</span>
    </div>
  )
}

function createLayoutProps(pluginConfig: ProviderPluginConfig) {
  return {
    pluginConfig,
    renderDefault: () => <ContextReader />,
  }
}

describe('DocumentInternationalizationProvider', () => {
  beforeEach(() => {
    mockClient = createMockSanityClient()
    mockUseWorkspace.mockReturnValue({name: 'default'})
    useSpy.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('provides sync supportedLanguages to descendants', () => {
    const props = createLayoutProps({
      ...DEFAULT_CONFIG,
      supportedLanguages: MOCK_LANGUAGES,
      schemaTypes: ['article'],
    })

    render(<DocumentInternationalizationProvider {...props} />, {wrapper: ThemeWrapper})

    expect(screen.getByTestId('lang-count')).toHaveTextContent(String(MOCK_LANGUAGES.length))
    expect(screen.getByTestId('first-lang')).toHaveTextContent('en')
    expect(screen.getByTestId('schema-types')).toHaveTextContent('article')
    // Sync path should not call React.use with a promise
    expect(useSpy).not.toHaveBeenCalled()
  })

  test('creates a languages promise when supportedLanguages is async', async () => {
    const languages = [
      {id: 'nb', title: 'Norwegian'},
      {id: 'en', title: 'English'},
    ]
    const asyncLanguages = vi.fn(async () => languages)

    const props = createLayoutProps({
      ...DEFAULT_CONFIG,
      supportedLanguages: asyncLanguages,
      schemaTypes: ['lesson'],
    })

    // Pre-resolve and stamp the promise result for our mocked use()
    // The provider will call createOrGetPromise which invokes asyncLanguages
    try {
      render(<DocumentInternationalizationProvider {...props} />, {wrapper: ThemeWrapper})
    } catch (thrown) {
      // Provider suspends by throwing the promise from mocked use()
      expect(thrown).toBeInstanceOf(Promise)
      const resolved = await (thrown as Promise<Language[]>)
      expect(resolved).toEqual(languages)
      ;(thrown as {__testResult?: Language[]}).__testResult = resolved
    }

    expect(asyncLanguages).toHaveBeenCalledWith(mockClient)
    expect(useSpy).toHaveBeenCalled()
  })

  test('reuses cached languages promise for the same workspace', async () => {
    const asyncLanguages = vi.fn(async () => [{id: 'en', title: 'English'}])
    mockUseWorkspace.mockReturnValue({name: 'workspace-cache-test'})

    const pluginConfig = {
      ...DEFAULT_CONFIG,
      supportedLanguages: asyncLanguages,
      schemaTypes: ['article'],
    }

    const firstProps = createLayoutProps(pluginConfig)
    try {
      render(<DocumentInternationalizationProvider {...firstProps} />, {wrapper: ThemeWrapper})
    } catch (thrown) {
      await (thrown as Promise<Language[]>)
      cleanup()
    }

    expect(asyncLanguages).toHaveBeenCalledTimes(1)

    const secondProps = createLayoutProps(pluginConfig)
    try {
      render(<DocumentInternationalizationProvider {...secondProps} />, {wrapper: ThemeWrapper})
    } catch (thrown) {
      await (thrown as Promise<Language[]>)
    }

    // Same workspace cache key — loader should not run again
    expect(asyncLanguages).toHaveBeenCalledTimes(1)
  })
})
