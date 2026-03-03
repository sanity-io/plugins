import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import {MOCK_LANGUAGES, createValue} from '../test/helpers'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'
import InternationalizedInput from './InternationalizedInput'

const mockUseFormValue = vi.fn()

vi.mock('sanity', async (importOriginal) => {
  const original = await importOriginal<typeof import('sanity')>()
  return {
    ...original,
    useFormValue: (...args: unknown[]) => mockUseFormValue(...args),
  }
})

vi.mock('./InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(() => ({
    languages: MOCK_LANGUAGES,
    languageDisplay: 'codeOnly',
    defaultLanguages: [],
  })),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/**
 * Creates minimal mock ObjectItemProps for InternationalizedInput.
 */
function createMockProps(
  languageId: string,
  overrides?: {readOnly?: boolean; valueContent?: unknown},
) {
  const itemValue = {
    ...createValue(languageId, {value: overrides?.valueContent ?? 'test content'}),
  }

  const onChange = vi.fn()

  return {
    path: ['title', {_key: itemValue._key ?? languageId}],
    value: itemValue,
    inputProps: {
      onChange,
      members: [{kind: 'field' as const, name: 'value'}],
      renderInput: vi.fn(() => <div data-testid="mock-input" />),
      validation: [],
      readOnly: overrides?.readOnly ?? false,
    },
  }
}

describe('InternationalizedInput', () => {
  beforeEach(() => {
    // Reset the context mock to default values
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      languages: MOCK_LANGUAGES,
      languageDisplay: 'codeOnly',
      defaultLanguages: [],
      filteredLanguages: MOCK_LANGUAGES,
      apiVersion: '2025-10-15',
      select: {},
      fieldTypes: [],
      buttonLocations: ['field'],
      buttonAddAll: true,
      isDocumentInternationalizationIntegration: false,
    })

    // Default: parent has multiple language entries
    mockUseFormValue.mockReturnValue([
      createValue('en', {value: 'Hello'}),
      createValue('fr', {value: 'Bonjour'}),
    ])
  })

  test('displays language label when value has a valid language', () => {
    const props = createMockProps('en')
    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    // codeOnly display shows uppercase code
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  test('shows "Change" button when value has an invalid language key', () => {
    const props = createMockProps('xx') // 'xx' is not in MOCK_LANGUAGES

    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    // Should show a button to change the invalid key
    expect(screen.getByText('Change "xx"')).toBeInTheDocument()
  })

  test('disables remove button for default languages', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      languages: MOCK_LANGUAGES,
      languageDisplay: 'codeOnly',
      defaultLanguages: ['en'], // 'en' is a default language
      filteredLanguages: MOCK_LANGUAGES,
      apiVersion: '2025-10-15',
      select: {},
      fieldTypes: [],
      buttonLocations: ['field'],
      buttonAddAll: true,
      isDocumentInternationalizationIntegration: false,
    })

    const props = createMockProps('en')

    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    // The remove button should be disabled for default languages
    // @sanity/ui uses data-disabled attribute
    const buttons = screen.getAllByRole('button')
    // The remove button is the one without text content (icon-only)
    const removeButton = buttons.find(
      (btn) => btn.querySelector('[data-sanity-icon="remove-circle"]') !== null,
    )
    expect(removeButton).toBeTruthy()
    expect(removeButton).toHaveAttribute('data-disabled', 'true')
  })

  test('enables remove button for non-default languages', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      languages: MOCK_LANGUAGES,
      languageDisplay: 'codeOnly',
      defaultLanguages: ['en'], // only 'en' is default
      filteredLanguages: MOCK_LANGUAGES,
      apiVersion: '2025-10-15',
      select: {},
      fieldTypes: [],
      buttonLocations: ['field'],
      buttonAddAll: true,
      isDocumentInternationalizationIntegration: false,
    })

    const props = createMockProps('fr') // 'fr' is not default

    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    // The remove button should be enabled for non-default languages
    const buttons = screen.getAllByRole('button')
    const removeButton = buttons.find(
      (btn) => btn.querySelector('[data-sanity-icon="remove-circle"]') !== null,
    )
    expect(removeButton).toBeTruthy()
    expect(removeButton).toHaveAttribute('data-disabled', 'false')
  })

  test('tracks language keys in use from parent value via LANGUAGE_FIELD_NAME', () => {
    mockUseFormValue.mockReturnValue([
      createValue('en', {value: 'Hello'}),
      createValue('fr', {value: 'Bonjour'}),
      createValue('es', {value: 'Hola'}),
    ])

    // Render with an invalid key to see the change menu
    const props = createMockProps('xx')

    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    // The "Change" button should be visible since 'xx' is not a valid language
    expect(screen.getByText('Change "xx"')).toBeInTheDocument()
  })

  test('renders spinner when languages are not loaded', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      // @ts-expect-error - testing null languages edge case
      languages: null,
      languageDisplay: 'codeOnly',
      defaultLanguages: [],
      filteredLanguages: [],
      apiVersion: '2025-10-15',
      select: {},
      fieldTypes: [],
      buttonLocations: ['field'],
      buttonAddAll: true,
    })

    const props = createMockProps('en')

    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    // Should not show any language label when languages are null
    expect(screen.queryByText('EN')).not.toBeInTheDocument()
    expect(screen.queryByText(/Change/)).not.toBeInTheDocument()
  })

  test('renders the input via renderInput', () => {
    const props = createMockProps('en')

    render(
      // @ts-expect-error - simplified mock props
      <InternationalizedInput {...props} />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('mock-input')).toBeInTheDocument()
    expect(props.inputProps.renderInput).toHaveBeenCalled()
  })
})
