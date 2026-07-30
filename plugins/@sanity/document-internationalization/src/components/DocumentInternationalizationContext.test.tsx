import {act, cleanup, render, screen} from '@testing-library/react'
import {Suspense} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {DEFAULT_CONFIG} from '../constants'
import {createMockSanityClient, ThemeWrapper} from '../test/component-helpers'
import {MOCK_LANGUAGES} from '../test/helpers'
import type {PluginConfig} from '../types'
import {
  DocumentInternationalizationProvider,
  useDocumentInternationalizationContext,
} from './DocumentInternationalizationContext'

type ProviderPluginConfig = Required<Omit<PluginConfig, 'metadataInternationalization'>> &
  Pick<PluginConfig, 'metadataInternationalization'>

let mockClient: ReturnType<typeof createMockSanityClient>
const mockUseWorkspace = vi.fn(() => ({name: 'default'}))

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

/**
 * Async `supportedLanguages` makes the provider suspend via React.use, so
 * those tests render inside a real Suspense boundary and must await `act` for
 * the suspended tree to resolve. Note: the provider caches the languages
 * promise per workspace name at module level, so each test must use a unique
 * workspace name.
 */
async function renderWithSuspense(props: ReturnType<typeof createLayoutProps>) {
  await act(async () => {
    render(
      <Suspense fallback={<div data-testid="loading" />}>
        <DocumentInternationalizationProvider {...props} />
      </Suspense>,
      {wrapper: ThemeWrapper},
    )
  })
}

describe('DocumentInternationalizationProvider', () => {
  beforeEach(() => {
    mockClient = createMockSanityClient()
    mockUseWorkspace.mockReturnValue({name: 'default'})
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
  })

  test('resolves async supportedLanguages and provides them to descendants', async () => {
    const languages = [
      {id: 'nb', title: 'Norwegian'},
      {id: 'en', title: 'English'},
    ]
    const asyncLanguages = vi.fn(async () => languages)
    mockUseWorkspace.mockReturnValue({name: 'workspace-async-test'})

    const props = createLayoutProps({
      ...DEFAULT_CONFIG,
      supportedLanguages: asyncLanguages,
      schemaTypes: ['lesson'],
    })

    await renderWithSuspense(props)

    expect(await screen.findByTestId('lang-count')).toHaveTextContent('2')
    expect(screen.getByTestId('first-lang')).toHaveTextContent('nb')
    expect(screen.getByTestId('schema-types')).toHaveTextContent('lesson')
    expect(asyncLanguages).toHaveBeenCalledWith(mockClient)
  })

  test('reuses cached languages promise for the same workspace', async () => {
    const asyncLanguages = vi.fn(async () => [{id: 'en', title: 'English'}])
    mockUseWorkspace.mockReturnValue({name: 'workspace-cache-test'})

    const pluginConfig = {
      ...DEFAULT_CONFIG,
      supportedLanguages: asyncLanguages,
      schemaTypes: ['article'],
    }

    await renderWithSuspense(createLayoutProps(pluginConfig))
    expect(await screen.findByTestId('lang-count')).toHaveTextContent('1')
    cleanup()

    await renderWithSuspense(createLayoutProps(pluginConfig))
    expect(await screen.findByTestId('lang-count')).toHaveTextContent('1')

    // Same workspace cache key — loader should not run again
    expect(asyncLanguages).toHaveBeenCalledTimes(1)
  })
})
