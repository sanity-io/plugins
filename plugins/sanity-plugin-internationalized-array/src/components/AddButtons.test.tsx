import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {ThemeWrapper} from '../test/component-helpers'
import {createValues, MOCK_INTERNATIONALIZED_ARRAY_CONTEXT} from '../test/helpers'
import type {Language} from '../types'
import AddButtons from './AddButtons'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

vi.mock('./InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(),
}))

/** Helper to find a @sanity/ui Button by its `value` attribute */
function getButtonByValue(value: string): HTMLElement {
  const buttons = screen.getAllByRole('button')
  const match = buttons.find((btn) => btn.getAttribute('value') === value)
  if (!match) throw new Error(`No button with value="${value}" found`)
  return match
}

describe('AddButtons', () => {
  beforeEach(() => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })
  test('renders a button for each language', () => {
    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)

    // Each button has the language id as its value attribute
    expect(getButtonByValue('en')).toBeInTheDocument()
    expect(getButtonByValue('fr')).toBeInTheDocument()
    expect(getButtonByValue('es')).toBeInTheDocument()
    expect(getButtonByValue('de')).toBeInTheDocument()
  })

  test('disables buttons for languages already present in value via LANGUAGE_FIELD_NAME', () => {
    const languagesInUse = createValues(['en', 'fr']).map((item) =>
      // oxlint-disable-next-line no-unnecessary-type-conversion
      String(item[LANGUAGE_FIELD_NAME]),
    )

    render(<AddButtons readOnly={false} languagesInUse={languagesInUse} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    // EN and FR already in value → disabled (data-disabled="true")
    expect(getButtonByValue('en')).toHaveAttribute('data-disabled', 'true')
    expect(getButtonByValue('fr')).toHaveAttribute('data-disabled', 'true')
    // ES and DE not in value → enabled
    expect(getButtonByValue('es')).toHaveAttribute('data-disabled', 'false')
    expect(getButtonByValue('de')).toHaveAttribute('data-disabled', 'false')
  })

  test('enables all buttons when value is empty', () => {
    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('data-disabled', 'false')
    })
  })

  test('disables all buttons when readOnly is true', () => {
    render(<AddButtons readOnly={true} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('data-disabled', 'true')
    })
  })

  test('renders null when languages array is empty', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      filteredLanguages: [],
    })

    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.queryByTestId('add-buttons-grid')).not.toBeInTheDocument()
  })

  test('calls handleClick when a button is clicked', () => {
    const handleClick = vi.fn()
    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={handleClick} />, {
      wrapper: ThemeWrapper,
    })

    fireEvent.click(getButtonByValue('fr'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('uses titleOnly display when configured', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      languageDisplay: 'titleOnly',
    })

    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
  })

  test('hides AddIcon when languages exceed MAX_COLUMNS in codeOnly mode', () => {
    // MAX_COLUMNS.codeOnly = 5, so 6 languages triggers the hidden icon branch
    const manyLanguages: Language[] = [
      {id: 'en', title: 'English'},
      {id: 'fr', title: 'French'},
      {id: 'es', title: 'Spanish'},
      {id: 'de', title: 'German'},
      {id: 'it', title: 'Italian'},
      {id: 'pt', title: 'Portuguese'},
    ]

    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      filteredLanguages: manyLanguages,
    })

    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    const buttons = screen.getAllByRole('button')
    // None of the buttons should have an icon (data-sanity-icon="add")
    buttons.forEach((button) => {
      expect(button.querySelector('[data-sanity-icon="add"]')).toBeNull()
    })
  })

  test('shows AddIcon when languages exceed MAX_COLUMNS but display is not codeOnly', () => {
    // MAX_COLUMNS.titleOnly = 4, so 5 languages exceeds it — but since
    // display is not 'codeOnly', AddIcon should still be shown
    const manyLanguages: Language[] = [
      {id: 'en', title: 'English'},
      {id: 'fr', title: 'French'},
      {id: 'es', title: 'Spanish'},
      {id: 'de', title: 'German'},
      {id: 'it', title: 'Italian'},
    ]
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      languageDisplay: 'titleOnly',
      filteredLanguages: manyLanguages,
    })

    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    const buttons = screen.getAllByRole('button')
    // All buttons should have the AddIcon
    buttons.forEach((button) => {
      expect(button.querySelector('[data-sanity-icon="add"]')).not.toBeNull()
    })
  })

  test('shows AddIcon when languages fit within MAX_COLUMNS in codeOnly mode', () => {
    // Default mock is codeOnly. MOCK_LANGUAGES has 4 items, MAX_COLUMNS.codeOnly = 5
    // 4 <= 5, so icons should be shown
    render(<AddButtons readOnly={false} languagesInUse={[]} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button.querySelector('[data-sanity-icon="add"]')).not.toBeNull()
    })
  })

  test('correctly identifies existing languages regardless of LANGUAGE_FIELD_NAME value', () => {
    // This test validates that the LANGUAGE_FIELD_NAME constant is used consistently.
    // When the constant changes from '_key' to 'language', this test verifies
    // that button disabled state still works correctly.
    const singleValue = createValues(['es'])
    // oxlint-disable-next-line no-unnecessary-type-conversion
    const languagesInUse = singleValue.map((item) => String(item[LANGUAGE_FIELD_NAME]))

    render(<AddButtons readOnly={false} languagesInUse={languagesInUse} handleClick={vi.fn()} />, {
      wrapper: ThemeWrapper,
    })

    // Only ES should be disabled
    expect(getButtonByValue('en')).toHaveAttribute('data-disabled', 'false')
    expect(getButtonByValue('fr')).toHaveAttribute('data-disabled', 'false')
    expect(getButtonByValue('es')).toHaveAttribute('data-disabled', 'true')
    expect(getButtonByValue('de')).toHaveAttribute('data-disabled', 'false')
  })
})
