import {cleanup, render} from '@testing-library/react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {MOCK_LANGUAGES} from '../test/helpers'

// Mock sanity's useFormValue to control what the component sees as its parent value
const mockUseFormValue = vi.fn()
vi.mock('sanity', () => ({
  useFormValue: (...args: unknown[]) => mockUseFormValue(...args),
}))

vi.mock('./InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(() => ({languages: MOCK_LANGUAGES})),
}))

import InternationalizedField from './InternationalizedField'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/**
 * Creates minimal mock FieldProps for InternationalizedField.
 * The component delegates rendering to `renderDefault` or returns `children`,
 * so these mocks focus on controlling what logic path the component takes.
 */
function createMockFieldProps(overrides: Record<string, unknown> = {}) {
  const renderDefault = vi.fn((props: Record<string, unknown>) => (
    // @ts-expect-error - simplified mock props
    <div data-testid="render-default">{props.title}</div>
  ))

  return {
    path: ['title', {_key: 'en'}, 'value'],
    title: 'Value',
    schemaType: {name: 'internationalizedArrayStringValue'},
    children: <div data-testid="children">children content</div>,
    renderDefault,
    value: undefined,
    ...overrides,
  }
}

describe('InternationalizedField', () => {
  describe('getLanguageId extraction via LANGUAGE_FIELD_NAME', () => {
    test('hides "Value" title when parent has a valid language via LANGUAGE_FIELD_NAME', () => {
      // Simulate the parent array item having a valid language field
      mockUseFormValue.mockReturnValue({
        _type: 'internationalizedArrayStringValue',
        [LANGUAGE_FIELD_NAME]: 'en',
      })

      // Non-internationalized schema types go through renderDefault
      // but the title should still be hidden since parent has a valid language
      const props = createMockFieldProps({
        title: 'Value',
        schemaType: {name: 'string'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      // renderDefault is called with hidden title (empty string)
      expect(props.renderDefault).toHaveBeenCalledWith(expect.objectContaining({title: ''}))
    })

    test('shows title when parent has no LANGUAGE_FIELD_NAME field', () => {
      // Parent doesn't have the language field
      mockUseFormValue.mockReturnValue({
        _type: 'someOtherType',
        value: 'test',
      })

      const props = createMockFieldProps({
        title: 'My Title',
        schemaType: {name: 'internationalizedArrayStringValue'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      // renderDefault is called with the original title preserved
      expect(props.renderDefault).toHaveBeenCalledWith(expect.objectContaining({title: 'My Title'}))
    })

    test('shows title when language id is not in the languages list', () => {
      // Parent has LANGUAGE_FIELD_NAME but with an invalid language
      mockUseFormValue.mockReturnValue({
        _type: 'internationalizedArrayStringValue',
        [LANGUAGE_FIELD_NAME]: 'xx', // not in MOCK_LANGUAGES
      })

      const props = createMockFieldProps({
        title: 'Value',
        schemaType: {name: 'internationalizedArrayStringValue'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      // Title should NOT be hidden since language is invalid
      expect(props.renderDefault).toHaveBeenCalledWith(expect.objectContaining({title: 'Value'}))
    })

    test('hides title for "value" fields with valid language', () => {
      mockUseFormValue.mockReturnValue({
        _type: 'internationalizedArrayStringValue',
        [LANGUAGE_FIELD_NAME]: 'fr',
      })

      const props = createMockFieldProps({
        title: 'Value',
        schemaType: {name: 'internationalizedArrayStringValue'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      // renderDefault called with empty title
      expect(props.renderDefault).toHaveBeenCalledWith(expect.objectContaining({title: ''}))
    })
  })

  describe('rendering based on schema type', () => {
    test('calls renderDefault for non-internationalized string schema type', () => {
      mockUseFormValue.mockReturnValue({
        _type: 'internationalizedArrayStringValue',
        [LANGUAGE_FIELD_NAME]: 'en',
      })

      const props = createMockFieldProps({
        schemaType: {name: 'string'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      // 'string' doesn't start with 'internationalizedArray' → renderDefault
      expect(props.renderDefault).toHaveBeenCalled()
    })

    test('calls renderDefault for non-internationalized number schema type', () => {
      mockUseFormValue.mockReturnValue({
        _type: 'internationalizedArrayNumberValue',
        [LANGUAGE_FIELD_NAME]: 'en',
      })

      const props = createMockFieldProps({
        schemaType: {name: 'number'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      // 'number' doesn't start with 'internationalizedArray' → renderDefault
      expect(props.renderDefault).toHaveBeenCalled()
    })

    test('uses renderDefault for non-internationalized schema types', () => {
      mockUseFormValue.mockReturnValue(null)

      const props = createMockFieldProps({
        schemaType: {name: 'someOtherType'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      expect(props.renderDefault).toHaveBeenCalled()
    })

    test('uses renderDefault with level 0 for complex internationalized types', () => {
      mockUseFormValue.mockReturnValue({
        _type: 'internationalizedArrayMarkdownValue',
        [LANGUAGE_FIELD_NAME]: 'en',
      })

      const props = createMockFieldProps({
        schemaType: {name: 'internationalizedArrayMarkdownValue'},
      })
      // @ts-expect-error - simplified mock props
      render(<InternationalizedField {...props} />)

      expect(props.renderDefault).toHaveBeenCalledWith(expect.objectContaining({level: 0}))
    })
  })
})
