import {act, cleanup, renderHook} from '@testing-library/react'
import {
  type DocumentFieldActionProps,
  type DocumentFieldActionItem,
  type DocumentFieldActionNode,
} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useInternationalizedArrayContext} from '../components/InternationalizedArrayContext'
import {LANGUAGE_FIELD_NAME} from '../constants'
import {createValues, MOCK_INTERNATIONALIZED_ARRAY_CONTEXT, MOCK_LANGUAGES} from '../test/helpers'
import {internationalizedArrayFieldAction} from './index'

const mockUseFormValue = vi.fn()
const mockOnChange = vi.fn()
let mockFormState: Record<string, unknown> | undefined

vi.mock('sanity', async (importOriginal) => {
  const original = await importOriginal<typeof import('sanity')>()
  return {
    ...original,
    useFormValue: (...args: unknown[]) => mockUseFormValue(...args),
  }
})

vi.mock('sanity/structure', () => ({
  useDocumentPane: vi.fn(() => ({
    onChange: mockOnChange,
    formState: mockFormState,
  })),
}))

vi.mock('../components/InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(() => ({
    languages: MOCK_LANGUAGES,
    filteredLanguages: MOCK_LANGUAGES,
  })),
}))

// defineDocumentFieldAction is mocked as identity, so we can access useAction directly
const fieldAction = internationalizedArrayFieldAction

function createMockFieldActionProps(
  overrides: Record<string, unknown> = {},
): DocumentFieldActionProps {
  return {
    documentId: '123',
    documentType: 'test',
    schemaType: {
      name: 'internationalizedArrayString',
      jsonType: 'string',
      type: {name: 'internationalizedArrayString', jsonType: 'string'},
    },
    path: ['translations'],
    ...overrides,
  }
}
const isActionItem = (action: DocumentFieldActionNode): action is DocumentFieldActionItem =>
  action.type === 'action'

describe('internationalizedArrayFieldAction', () => {
  beforeEach(() => {
    mockUseFormValue.mockReturnValue(undefined)
    mockOnChange.mockClear()
    mockFormState = undefined
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )
  })

  afterEach(() => {
    cleanup()
  })

  test('has name "internationalizedArray"', () => {
    expect(fieldAction.name).toBe('internationalizedArray')
  })

  test('returns a group action with correct metadata', () => {
    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    expect(result.current.type).toBe('group')
    expect(result.current.title).toBe('Add Translation')
    expect(result.current.renderAsButton).toBe(true)
  })

  test('hidden with empty children when schema type is not internationalized', () => {
    const props = createMockFieldActionProps({
      schemaType: {
        name: 'string',
        type: {name: 'string'},
      },
    })

    const {result} = renderHook(() => fieldAction.useAction(props))

    expect(result.current.hidden).toBe(true)
  })

  test('not hidden when schema type starts with internationalizedArray', () => {
    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    expect(result.current.hidden).toBe(false)
  })

  test('creates one action per language plus add-missing action', () => {
    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    // 4 languages + 1 "add missing" = 5
    expect(fieldGroup.children).toHaveLength(5)
    fieldGroup.children.slice(0, 4).forEach((action) => {
      expect(action.type).toBe('action')
    })
  })

  test('translate action titles match language titles', () => {
    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const actions = fieldGroup.children.slice(0, 4).filter(isActionItem)
    expect(actions[0]!.title).toBe('English')
    expect(actions[1]!.title).toBe('French')
    expect(actions[2]!.title).toBe('Spanish')
    expect(actions[3]!.title).toBe('German')
  })

  test('translate action disabled when language exists in value via LANGUAGE_FIELD_NAME', () => {
    const value = createValues(['en', 'fr'])
    mockUseFormValue.mockReturnValue(value)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const actions = fieldGroup.children.slice(0, 4).filter(isActionItem)
    expect(actions[0]!.disabled).toBe(true) // en - in value
    expect(actions[1]!.disabled).toBe(true) // fr - in value
    expect(actions[2]!.disabled).toBe(false) // es - not in value
    expect(actions[3]!.disabled).toBe(false) // de - not in value
  })

  test('all translate actions enabled when value is undefined', () => {
    mockUseFormValue.mockReturnValue(undefined)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }

    fieldGroup.children
      .slice(0, 4)
      .filter(isActionItem)
      .forEach((action) => {
        expect(action.disabled).toBe(false)
      })
  })

  test('translate action hidden when language not in filteredLanguages', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      languages: MOCK_LANGUAGES,
      filteredLanguages: MOCK_LANGUAGES.slice(0, 2), // en, fr only
    })

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }

    const actions = fieldGroup.children.slice(0, 4).filter(isActionItem)
    expect(actions[0]!.hidden).toBe(false) // en in filtered
    expect(actions[1]!.hidden).toBe(false) // fr in filtered
    expect(actions[2]!.hidden).toBe(true) // es not in filtered
    expect(actions[3]!.hidden).toBe(true) // de not in filtered
  })

  test('translate action onAction calls onChange with setIfMissing and insert patches', () => {
    mockUseFormValue.mockReturnValue(undefined)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }

    act(() => {
      const action = fieldGroup.children[0]
      if (!action || !isActionItem(action)) {
        throw new Error('Action is not an action item')
      }
      action.onAction()
    })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith({
      patches: [
        {
          patchType: Symbol.for('sanity.patch'),
          path: ['translations'],
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
          patchType: Symbol.for('sanity.patch'),
          path: ['translations', -1],
          position: 'after',
          type: 'insert',
        },
      ],
    })
  })

  test('add-missing action hidden when all languages present', () => {
    const value = createValues(['en', 'fr', 'es', 'de'])
    mockUseFormValue.mockReturnValue(value)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }
    expect(addMissing.hidden).toBe(true)
  })

  test('add-missing action not hidden when languages are missing', () => {
    const value = createValues(['en'])
    mockUseFormValue.mockReturnValue(value)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }
    expect(addMissing.hidden).toBe(false)
  })

  test('add-missing action disabled when all filtered languages in value', () => {
    const value = createValues(['en', 'fr', 'es', 'de'])
    mockUseFormValue.mockReturnValue(value)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))
    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }
    expect(addMissing.disabled).toBe(true)
  })

  test('add-missing action not disabled when languages are missing', () => {
    mockUseFormValue.mockReturnValue(undefined)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }
    expect(addMissing.disabled).toBeFalsy()
  })

  test('add-missing action title says "Add all languages" when no value', () => {
    mockUseFormValue.mockReturnValue(undefined)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }
    expect(addMissing.title).toBe('Add all languages')
  })

  test('add-missing onAction calls onChange with patches for all missing languages', () => {
    const value = createValues(['en'])
    mockUseFormValue.mockReturnValue(value)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }

    act(() => {
      addMissing.onAction()
    })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith({
      patches: [
        {
          patchType: Symbol.for('sanity.patch'),
          path: ['translations'],
          type: 'setIfMissing',
          value: [],
        },
        {
          items: [
            {
              [LANGUAGE_FIELD_NAME]: 'fr',
              _key: expect.any(String),
              _type: 'internationalizedArrayStringValue',
            },
          ],
          patchType: Symbol.for('sanity.patch'),
          path: ['translations', -1],
          position: 'after',
          type: 'insert',
        },
        {
          items: [
            {
              [LANGUAGE_FIELD_NAME]: 'es',
              _key: expect.any(String),
              _type: 'internationalizedArrayStringValue',
            },
          ],
          patchType: Symbol.for('sanity.patch'),
          path: ['translations', -1],
          position: 'after',
          type: 'insert',
        },
        {
          items: [
            {
              [LANGUAGE_FIELD_NAME]: 'de',
              _key: expect.any(String),
              _type: 'internationalizedArrayStringValue',
            },
          ],
          patchType: Symbol.for('sanity.patch'),
          path: ['translations', -1],
          position: 'after',
          type: 'insert',
        },
      ],
    })
  })

  test('all translate actions disabled when document is readOnly', () => {
    mockFormState = {readOnly: true}
    mockUseFormValue.mockReturnValue(undefined)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }

    fieldGroup.children.filter(isActionItem).forEach((action) => {
      expect(action.disabled).toBe(true)
    })
  })

  test('add-missing action disabled when document is readOnly', () => {
    mockFormState = {readOnly: true}
    mockUseFormValue.mockReturnValue(undefined)

    const {result} = renderHook(() => fieldAction.useAction(createMockFieldActionProps()))

    const fieldGroup = result.current.type === 'group' ? result.current : undefined
    if (!fieldGroup) {
      throw new Error('Field group not found')
    }
    const addMissing = fieldGroup.children[fieldGroup.children.length - 1]!
    if (!isActionItem(addMissing)) {
      throw new Error('Add missing action is not an action item')
    }
    expect(addMissing.disabled).toBe(true)
  })
})
