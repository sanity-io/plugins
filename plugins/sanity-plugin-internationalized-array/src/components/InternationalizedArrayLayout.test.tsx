/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, render, screen} from '@testing-library/react'
import type {DocumentLayoutProps} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {CONFIG_DEFAULT} from '../constants'
import {MOCK_LANGUAGES} from '../test/helpers'
import type {PluginConfig} from '../types'
import {InternationalizedArrayLayout} from './InternationalizedArrayLayout'

const mockUseSchema = vi.fn()

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useSchema: () => mockUseSchema(),
    isDocumentSchemaType: (schemaType: {jsonType?: string}) => schemaType?.jsonType === 'object',
  }
})

vi.mock('./InternationalizedArrayContext', () => ({
  InternationalizedArrayProvider: ({
    children,
    documentType,
  }: {
    children: React.ReactNode
    documentType: string
  }) => (
    <div data-testid="i18n-provider" data-document-type={documentType}>
      {children}
    </div>
  ),
}))

function createProps(documentType: string): DocumentLayoutProps & {
  pluginConfig: Required<PluginConfig>
} {
  return {
    documentType,
    pluginConfig: {
      ...CONFIG_DEFAULT,
      languages: MOCK_LANGUAGES,
      fieldTypes: ['string'],
    },
    renderDefault: () => <div data-testid="default-layout" />,
  } as unknown as DocumentLayoutProps & {pluginConfig: Required<PluginConfig>}
}

describe('InternationalizedArrayLayout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('wraps with provider when schema has internationalized array fields', () => {
    mockUseSchema.mockReturnValue({
      get: () => ({
        name: 'i18nPost',
        jsonType: 'object',
        fields: [
          {
            name: 'title',
            type: {name: 'internationalizedArrayString', jsonType: 'array', of: []},
          },
        ],
      }),
    })

    render(<InternationalizedArrayLayout {...createProps('i18nPost')} />)

    expect(screen.getByTestId('i18n-provider')).toHaveAttribute('data-document-type', 'i18nPost')
    expect(screen.getByTestId('default-layout')).toBeInTheDocument()
  })

  test('skips provider when schema has no internationalized arrays', () => {
    mockUseSchema.mockReturnValue({
      get: () => ({
        name: 'plainDoc',
        jsonType: 'object',
        fields: [{name: 'title', type: {name: 'string', jsonType: 'string'}}],
      }),
    })

    render(<InternationalizedArrayLayout {...createProps('plainDoc')} />)

    expect(screen.queryByTestId('i18n-provider')).not.toBeInTheDocument()
    expect(screen.getByTestId('default-layout')).toBeInTheDocument()
  })

  test('skips provider when includeForDocumentType returns false', () => {
    mockUseSchema.mockReturnValue({
      get: () => ({
        name: 'translation.metadata',
        jsonType: 'object',
        fields: [
          {
            name: 'translations',
            type: {name: 'internationalizedArrayReference', jsonType: 'array', of: []},
          },
        ],
      }),
    })

    const props = createProps('translation.metadata')
    render(<InternationalizedArrayLayout {...props} />)

    expect(screen.queryByTestId('i18n-provider')).not.toBeInTheDocument()
    expect(screen.getByTestId('default-layout')).toBeInTheDocument()
  })

  test('falls back to default when schema type is missing', () => {
    mockUseSchema.mockReturnValue({get: () => undefined})

    render(<InternationalizedArrayLayout {...createProps('missing')} />)

    expect(screen.queryByTestId('i18n-provider')).not.toBeInTheDocument()
    expect(screen.getByTestId('default-layout')).toBeInTheDocument()
    expect(console.error).toHaveBeenCalled()
  })
})
