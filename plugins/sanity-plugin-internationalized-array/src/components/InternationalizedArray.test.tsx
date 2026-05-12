import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {createValues, MOCK_INTERNATIONALIZED_ARRAY_CONTEXT, MOCK_LANGUAGES} from '../test/helpers'

const mockToastPush = vi.fn()
const mockGetFormValue = vi.fn()

vi.mock('sanity', () => ({
  useFormValue: vi.fn(() => 'article'),
  useGetFormValue: vi.fn(() => mockGetFormValue),
  ArrayOfObjectsItem: () => <div data-testid="array-item" />,
  MemberItemError: () => <div data-testid="member-error" />,
  set: vi.fn((value: unknown) => ({type: 'set', value})),
  setIfMissing: vi.fn((value: unknown) => ({type: 'setIfMissing', value})),
  insert: vi.fn((items: unknown[], position: string, path: unknown[]) => ({
    type: 'insert',
    items,
    position,
    path,
  })),
}))

vi.mock('sanity/structure', () => ({
  useDocumentPane: vi.fn(() => ({
    isDeleting: false,
    onChange: vi.fn(),
  })),
}))

vi.mock('@sanity/language-filter', () => ({
  useLanguageFilterStudioContext: vi.fn(() => ({
    selectedLanguageIds: [],
    options: {
      documentTypes: [],
      filterField: () => true,
    },
  })),
}))

vi.mock('./InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(() => ({
    languages: MOCK_LANGUAGES,
    filteredLanguages: MOCK_LANGUAGES,
    defaultLanguages: [],
    buttonAddAll: true,
    buttonLocations: ['field'],
    languageDisplay: 'codeOnly',
    apiVersion: '2025-10-15',
    select: {},
    fieldTypes: [],
  })),
}))

vi.mock('@sanity/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@sanity/ui')>()
  return {
    ...original,
    useToast: () => ({push: mockToastPush}),
  }
})

vi.mock('./Feedback', () => ({
  default: () => <div data-testid="feedback">Invalid languages configuration</div>,
}))

import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {useDocumentPane} from 'sanity/structure'

import {ThemeWrapper} from '../test/component-helpers'
import InternationalizedArray from './InternationalizedArray'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

/**
 * Creates minimal mock ArrayOfObjectsInputProps for InternationalizedArray.
 */
function createMockArrayProps(overrides: Record<string, unknown> = {}) {
  return {
    members: [],
    value: undefined,
    schemaType: {name: 'internationalizedArrayString', readOnly: false},
    onChange: vi.fn(),
    path: [],
    readOnly: false,
    ...overrides,
  }
}

function renderInternationalizedArray(props: ReturnType<typeof createMockArrayProps>) {
  mockGetFormValue.mockImplementation(() => props.value)
  return render(
    // @ts-expect-error - simplified mock props
    <InternationalizedArray {...props} />,
    {wrapper: ThemeWrapper},
  )
}

describe('InternationalizedArray', () => {
  beforeEach(() => {
    mockToastPush.mockClear()
    mockGetFormValue.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('shows "no translations" message when field is empty and add buttons are hidden', () => {
    // No value, no members, but all languages present (no add buttons)
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      filteredLanguages: [],
    })

    const props = createMockArrayProps()

    renderInternationalizedArray(props)

    expect(
      screen.getByText('This internationalized field currently has no translations.'),
    ).toBeInTheDocument()
  })

  test('shows add buttons when not all languages are present', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    // Only 'en' has a value, 3 languages missing
    const value = createValues(['en'])
    const props = createMockArrayProps({value})

    renderInternationalizedArray(props)

    expect(screen.getByTestId('add-en')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-fr')).toBeInTheDocument()
    expect(screen.getByTestId('add-es')).toBeInTheDocument()
    expect(screen.getByTestId('add-de')).toBeInTheDocument()
    expect(screen.getByTestId('add-all-languages')).toBeInTheDocument()
  })

  test('hides add buttons when all languages are present', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    // All 4 languages present — add buttons should be hidden
    const value = createValues(['en', 'fr', 'es', 'de'])
    const props = createMockArrayProps({value})

    renderInternationalizedArray(props)

    expect(screen.queryByTestId('add-buttons')).not.toBeInTheDocument()
  })

  test('shows Feedback component when languages configuration is invalid', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      languages: [{id: '', title: ''}],
      filteredLanguages: [],
    })

    const props = createMockArrayProps()

    renderInternationalizedArray(props)

    expect(screen.getByTestId('feedback')).toBeInTheDocument()
  })

  test('hides add buttons when buttonLocations does not include "field"', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      buttonLocations: ['document'], // not 'field'
    })

    const value = createValues(['en']) // missing languages, but button location is 'document'
    const props = createMockArrayProps({value})

    renderInternationalizedArray(props)

    expect(screen.queryByTestId('add-buttons')).not.toBeInTheDocument()
  })

  test('shows "Add all languages" button when buttonAddAll is true and languages are missing', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const props = createMockArrayProps()

    renderInternationalizedArray(props)

    expect(screen.getByText('Add all languages')).toBeInTheDocument()
  })

  test('extracts added languages using LANGUAGE_FIELD_NAME with _key fallback', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    // Provide 2 of 4 languages → add buttons should be visible
    const value = createValues(['en', 'fr'])
    const props = createMockArrayProps({value})

    renderInternationalizedArray(props)

    expect(screen.getByTestId('add-en')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-fr')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-es')).toHaveAttribute('data-disabled', 'false')
    expect(screen.getByTestId('add-de')).toHaveAttribute('data-disabled', 'false')
    // "Add all languages" button visible → 2 languages are missing
    expect(screen.getByTestId('add-all-languages')).toBeInTheDocument()
  })

  test('calls onChange when a language button is clicked via handleAddLanguage', async () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const onChange = vi.fn()
    const props = createMockArrayProps({onChange})

    renderInternationalizedArray(props)

    fireEvent.click(screen.getByTestId('add-en'))
    expect(onChange).toHaveBeenCalledWith([
      {
        type: 'setIfMissing',
        value: [],
      },
      {
        items: [
          {
            [LANGUAGE_FIELD_NAME]: 'en',
            _key: expect.any(String),
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
    ])
  })

  test('calls onChange with all languages when "Add all languages" is clicked and value is empty', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const onChange = vi.fn()
    const props = createMockArrayProps({onChange, value: []})

    renderInternationalizedArray(props)

    fireEvent.click(screen.getByTestId('add-all-languages'))

    expect(onChange).toHaveBeenCalledWith([
      {
        type: 'setIfMissing',
        value: [],
      },
      {
        items: [
          {
            _key: expect.any(String),
            [LANGUAGE_FIELD_NAME]: 'en',
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
      {
        items: [
          {
            _key: expect.any(String),
            [LANGUAGE_FIELD_NAME]: 'fr',
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
      {
        items: [
          {
            _key: expect.any(String),
            [LANGUAGE_FIELD_NAME]: 'es',
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
      {
        items: [
          {
            _key: expect.any(String),
            [LANGUAGE_FIELD_NAME]: 'de',
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
    ])
  })

  test('calls onChange with only missing languages when "Add all languages" is clicked', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const onChange = vi.fn()
    // "en" and "es" already exist, so only "fr" and "de" should be added
    const value = createValues(['en', 'es'])
    const props = createMockArrayProps({onChange, value})

    renderInternationalizedArray(props)

    fireEvent.click(screen.getByTestId('add-all-languages'))

    expect(onChange).toHaveBeenCalledWith([
      {
        type: 'setIfMissing',
        value: [],
      },
      {
        items: [
          {
            _key: expect.any(String),
            [LANGUAGE_FIELD_NAME]: 'fr',
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [1],
        position: 'before',
        type: 'insert',
      },
      {
        items: [
          {
            _key: expect.any(String),
            [LANGUAGE_FIELD_NAME]: 'de',
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
    ])
  })

  test('auto-reorders value when items are out of order', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const onChange = vi.fn()
    // Out of order: fr before en (languages order is en, fr, es, de)
    const value = createValues(['fr', 'en'])
    const props = createMockArrayProps({onChange, value})

    renderInternationalizedArray(props)

    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith({
      type: 'set',
      value: [
        {
          [LANGUAGE_FIELD_NAME]: 'en',
          _key: expect.any(String),
          _type: 'internationalizedArrayStringValue',
          value: undefined,
        },
        {
          [LANGUAGE_FIELD_NAME]: 'fr',
          _key: expect.any(String),
          _type: 'internationalizedArrayStringValue',
          value: undefined,
        },
      ],
    })
  })

  test('does not auto-reorder when document is readOnly', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const onChange = vi.fn()
    const value = createValues(['fr', 'en'])
    // readOnly at the document level (props.readOnly, mapped to documentReadOnly)
    const props = createMockArrayProps({onChange, value, readOnly: true})

    renderInternationalizedArray(props)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('auto-adds default languages when they are missing', async () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      defaultLanguages: ['en', 'fr'],
    })

    const onChange = vi.fn()
    const props = createMockArrayProps({onChange})

    renderInternationalizedArray(props)

    // The default language useEffect uses setTimeout, wait for it
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })
    expect(onChange).toHaveBeenCalledWith([
      {
        type: 'setIfMissing',
        value: [],
      },
      {
        items: [
          {
            [LANGUAGE_FIELD_NAME]: 'en',
            _key: expect.any(String),
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
      {
        items: [
          {
            [LANGUAGE_FIELD_NAME]: 'fr',
            _key: expect.any(String),
            _type: 'internationalizedArrayStringValue',
          },
        ],
        path: [-1],
        position: 'after',
        type: 'insert',
      },
    ])
  })

  test('does not auto-add default languages when document is being deleted', () => {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    vi.mocked(useDocumentPane).mockReturnValue({
      isDeleting: true,
    } as ReturnType<typeof useDocumentPane>)

    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const onChange = vi.fn()
    const props = createMockArrayProps({onChange})

    renderInternationalizedArray(props)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not auto-add default languages when documentReadOnly is true', async () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      defaultLanguages: ['en'],
    })

    const onChange = vi.fn()
    const props = createMockArrayProps({onChange, readOnly: true})

    renderInternationalizedArray(props)

    // Allow the scheduled setTimeout in the useEffect to fire
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onChange).not.toHaveBeenCalled()
  })

  test('hides "Add all languages" button when buttonAddAll is false', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      buttonAddAll: false,
    })

    const props = createMockArrayProps()

    renderInternationalizedArray(props)
    expect(screen.getByTestId('add-en')).toBeInTheDocument()
    expect(screen.getByTestId('add-fr')).toBeInTheDocument()
    expect(screen.getByTestId('add-es')).toBeInTheDocument()
    expect(screen.getByTestId('add-de')).toBeInTheDocument()
    expect(screen.queryByTestId('add-all-languages')).not.toBeInTheDocument()
  })

  test('passes readOnly to AddButtons and disables "Add all" button when schema is readOnly', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const props = createMockArrayProps({
      schemaType: {name: 'internationalizedArrayString', readOnly: true},
    })

    renderInternationalizedArray(props)

    expect(screen.getByTestId('add-en')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-fr')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-es')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-de')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-all-languages')).toHaveAttribute('data-disabled', 'true')
  })

  test('disables add buttons when document is readOnly (props.readOnly)', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const props = createMockArrayProps({
      readOnly: true,
      schemaType: {name: 'internationalizedArrayString', readOnly: false},
    })

    renderInternationalizedArray(props)

    expect(screen.getByTestId('add-en')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-fr')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-es')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-de')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('add-all-languages')).toHaveAttribute('data-disabled', 'true')
  })

  test('filters members when language filter is enabled for the document type', () => {
    const mockFilterField = vi.fn(() => true)
    vi.mocked(useLanguageFilterStudioContext).mockReturnValue({
      selectedLanguageIds: ['en'],
      setSelectedLanguageIds: vi.fn(),
      options: {
        documentTypes: ['article'],
        filterField: mockFilterField,
        apiVersion: '2025-10-15',
        defaultLanguages: [],
        supportedLanguages: MOCK_LANGUAGES,
      },
    })

    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const mockMembers = [
      {
        kind: 'item',
        key: 'en',
        item: {
          schemaType: {name: 'internationalizedArrayStringValue'},
          members: [{kind: 'field', name: 'value'}],
        },
      },
      {
        kind: 'item',
        key: 'fr',
        item: {
          schemaType: {name: 'internationalizedArrayStringValue'},
          members: [{kind: 'field', name: 'value'}],
        },
      },
    ]

    const value = createValues(['en', 'fr'])
    const props = createMockArrayProps({members: mockMembers, value})

    renderInternationalizedArray(props)

    // filterField should have been called for each member
    // since useFormValue returns 'article' which is in documentTypes
    expect(mockFilterField).toHaveBeenCalledTimes(2)
  })

  test('renders MemberItemError for members with kind !== "item"', () => {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    vi.mocked(useDocumentPane).mockReturnValue({
      isDeleting: false,
    } as ReturnType<typeof useDocumentPane>)

    vi.mocked(useLanguageFilterStudioContext).mockReturnValue({
      selectedLanguageIds: [],
      setSelectedLanguageIds: vi.fn(),
      options: {
        documentTypes: [],
        filterField: () => true,
        apiVersion: '2025-10-15',
        defaultLanguages: [],
        supportedLanguages: [],
      },
    })

    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    const mockMembers = [{kind: 'error', key: 'error-1'}]

    const props = createMockArrayProps({members: mockMembers})

    renderInternationalizedArray(props)

    expect(screen.getByTestId('member-error')).toBeInTheDocument()
  })

  // Reproduction for https://github.com/sanity-io/plugins/issues/520
  //
  // When a user opens the *published* version of a document that was just
  // released with an internationalized array whose items are in a different
  // order than the master `languages` config, Studio shows the field as
  // read-only but `props.readOnly` arrives at this component as falsy. The
  // auto-reorder useEffect then fires `onChange(set(...))` against the
  // read-only document and Studio throws:
  //
  //   "Attempted to patch a read-only document"
  //
  // We simulate Studio's behaviour by passing an `onChange` that throws that
  // exact error. With the bug present, the throw escapes the render call.
  // With a fix in place (a try/catch around the auto-reorder onChange, or a
  // tighter readOnly check that covers the published/release perspective),
  // the render should complete cleanly.
  test('does not crash when onChange rejects with a read-only error during auto-reorder (issue #520)', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )

    // Out of order: matches the user's API push order in the issue.
    // languages config is [en, fr, es, de]; value is pushed as [es, en, de, fr].
    const value = createValues(['es', 'en', 'de', 'fr'])

    // Studio's real onChange for a read-only document throws synchronously.
    const readOnlyError = new Error('Attempted to patch a read-only document')
    const onChange = vi.fn(() => {
      throw readOnlyError
    })

    // props.readOnly is falsy — this is the heart of the bug. Studio
    // considers the document read-only (published perspective) but the
    // prop arriving here does not reflect that.
    const props = createMockArrayProps({onChange, value, readOnly: false})

    expect(() => renderInternationalizedArray(props)).not.toThrow()
  })
})
