import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {ThemeWrapper} from '../test/component-helpers'
import {MOCK_LANGUAGES} from '../test/helpers'
import DocumentAddButtons from './DocumentAddButtons'

const mockOnChange = vi.fn()
const mockToastPush = vi.fn()
const mockGetFormValue = vi.fn()

vi.mock('sanity', () => ({
  isSanityDocument: vi.fn(
    (v: unknown) =>
      typeof v === 'object' && v !== null && '_id' in v && '_type' in v && '_rev' in v,
  ),
  PatchEvent: {from: vi.fn((patches: unknown) => patches)},
  insert: vi.fn((items: unknown[], position: string, path: unknown[]) => ({
    type: 'insert',
    items,
    position,
    path,
  })),
  setIfMissing: vi.fn((value: unknown, path: unknown) => ({
    type: 'setIfMissing',
    value,
    path,
  })),
  useGetFormValue: vi.fn(() => mockGetFormValue),
  useSchema: vi.fn(() => ({get: vi.fn(() => undefined)})),
}))

vi.mock('sanity/structure', () => ({
  useDocumentPane: vi.fn(() => ({
    onChange: mockOnChange,
  })),
}))

vi.mock('./InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(() => ({
    filteredLanguages: MOCK_LANGUAGES,
    languages: MOCK_LANGUAGES,
    defaultLanguages: [],
    languageDisplay: 'codeOnly',
    apiVersion: '2025-10-15',
    select: {},
    fieldTypes: [],
    buttonLocations: ['document'],
    buttonAddAll: true,
  })),
}))

vi.mock('@sanity/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@sanity/ui')>()
  return {
    ...original,
    useToast: () => ({push: mockToastPush}),
  }
})

afterEach(() => {
  cleanup()
})

describe('DocumentAddButtons', () => {
  beforeEach(() => {
    mockOnChange.mockClear()
    mockToastPush.mockClear()
    mockGetFormValue.mockReset()
  })

  test('renders heading and add buttons', () => {
    mockGetFormValue.mockReturnValue(undefined)
    render(<DocumentAddButtons />, {wrapper: ThemeWrapper})

    expect(screen.getByText('Add translation to internationalized fields')).toBeInTheDocument()
    expect(screen.getByTestId('add-fr')).toBeInTheDocument()
    expect(screen.getByTestId('add-en')).toBeInTheDocument()
    expect(screen.getByTestId('add-es')).toBeInTheDocument()
    expect(screen.getByTestId('add-de')).toBeInTheDocument()
  })

  test('shows error toast when document has no internationalized fields', async () => {
    // Document with no internationalized array fields
    const docValue = {
      _id: 'doc1',
      _type: 'article',
      _rev: 'rev1',
      _createdAt: '',
      _updatedAt: '',
      title: 'Just a plain string',
    }

    mockGetFormValue.mockReturnValue(docValue)
    render(<DocumentAddButtons />, {wrapper: ThemeWrapper})
    fireEvent.click(screen.getByTestId('add-fr'))

    expect(mockToastPush).toHaveBeenCalledWith({
      status: 'error',
      title: 'No internationalizedArray fields found in document root',
    })
  })

  test('creates patches when adding translation for a new language', async () => {
    const docValue = {
      _id: 'doc1',
      _type: 'article',
      _rev: 'rev1',
      _createdAt: '',
      _updatedAt: '',
      title: [
        {
          [LANGUAGE_FIELD_NAME]: 'en',
          _key: 'random-key',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
        },
      ],
    }

    mockGetFormValue.mockReturnValue(docValue)
    render(<DocumentAddButtons />, {wrapper: ThemeWrapper})

    fireEvent.click(screen.getByTestId('add-fr'))

    // onChange should have been called with patches
    expect(mockOnChange).toHaveBeenCalledWith([
      {
        type: 'setIfMissing',
        value: [],
        path: ['title'],
      },
      {
        type: 'insert',
        items: [
          {
            [LANGUAGE_FIELD_NAME]: 'fr',
            _key: expect.any(String),
            _type: 'internationalizedArrayStringValue',
          },
        ],
        position: 'after',
        path: ['title', -1],
      },
    ])
  })

  test('creates patches when adding translation for new language to multiple fields', async () => {
    const docValue = {
      _id: 'doc1',
      _type: 'article',
      _rev: 'rev1',
      _createdAt: '',
      _updatedAt: '',
      title: [
        {
          [LANGUAGE_FIELD_NAME]: 'en',
          _key: 'random-key',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
        },
      ],
      description: [
        {
          [LANGUAGE_FIELD_NAME]: 'en',
          _key: 'random-key',
          _type: 'internationalizedArrayStringValue',
          value: 'Description',
        },
      ],
    }

    mockGetFormValue.mockReturnValue(docValue)
    render(<DocumentAddButtons />, {wrapper: ThemeWrapper})
    fireEvent.click(screen.getByTestId('add-fr'))
    // onChange should have been called with patches
    expect(mockOnChange).toHaveBeenCalledWith([
      {
        type: 'setIfMissing',
        value: [],
        path: ['title'],
      },
      {
        type: 'insert',
        items: [
          {
            [LANGUAGE_FIELD_NAME]: 'fr',
            _key: expect.any(String),
            _type: 'internationalizedArrayStringValue',
          },
        ],
        position: 'after',
        path: ['title', -1],
      },
      {
        type: 'setIfMissing',
        value: [],
        path: ['description'],
      },
      {
        type: 'insert',
        items: [
          {
            [LANGUAGE_FIELD_NAME]: 'fr',
            _key: expect.any(String),
            _type: 'internationalizedArrayStringValue',
          },
        ],
        position: 'after',
        path: ['description', -1],
      },
    ])
  })

  test('skips fields that already have the selected language translation', async () => {
    const docValue = {
      _id: 'doc1',
      _type: 'article',
      _rev: 'rev1',
      _createdAt: '',
      _updatedAt: '',
      title: [
        {
          [LANGUAGE_FIELD_NAME]: 'en',
          _key: 'random-key',
          _type: 'internationalizedArrayStringValue',
          value: 'Hello',
        },
      ],
    }

    mockGetFormValue.mockReturnValue(docValue)
    render(<DocumentAddButtons />, {wrapper: ThemeWrapper})
    // Add 'en' again - should be filtered out as already existing
    fireEvent.click(screen.getByTestId('add-en'))

    // Since all fields already have 'en', the toast should show an error
    // (the filter reduces to 0 items)
    expect(mockToastPush).toHaveBeenCalledWith({
      status: 'error',
      title: 'No internationalizedArray fields found in document root',
    })
  })
})
