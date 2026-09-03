import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {LANGUAGE_FIELD_NAME} from '../constants'
import {ThemeWrapper} from '../test/component-helpers'
import {createValues, MOCK_INTERNATIONALIZED_ARRAY_CONTEXT} from '../test/helpers'
import CompactAddButton from './CompactAddButton'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

vi.mock('./InternationalizedArrayContext', () => ({
  useInternationalizedArrayContext: vi.fn(),
}))

function openMenu() {
  fireEvent.click(screen.getByTestId('add-translation-menu'))
}

describe('CompactAddButton', () => {
  beforeEach(() => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue(
      MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('renders the icon even when all languages are present', () => {
    const languagesInUse = createValues(['en', 'fr', 'es', 'de']).map((item) =>
      String(item[LANGUAGE_FIELD_NAME]),
    )

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={languagesInUse}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('add-translation-menu')).toBeInTheDocument()
    expect(screen.getByTestId('add-buttons-grid')).toBeInTheDocument()
  })

  test('disables present languages and leaves missing ones enabled', () => {
    const languagesInUse = createValues(['en', 'fr']).map((item) =>
      String(item[LANGUAGE_FIELD_NAME]),
    )

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={languagesInUse}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.getByTestId('add-en')).toBeDisabled()
    expect(screen.getByTestId('add-fr')).toBeDisabled()
    expect(screen.getByTestId('add-es')).toBeEnabled()
    expect(screen.getByTestId('add-de')).toBeEnabled()
  })

  test('disables "Add missing translations" when nothing is missing', () => {
    const languagesInUse = createValues(['en', 'fr', 'es', 'de']).map((item) =>
      String(item[LANGUAGE_FIELD_NAME]),
    )

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={languagesInUse}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.getByTestId('add-all-languages')).toBeDisabled()
  })

  test('enables "Add missing translations" when languages are missing', () => {
    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.getByTestId('add-all-languages')).toBeEnabled()
  })

  test.each([
    ['codeOnly', ['EN', 'FR']] as const,
    ['titleOnly', ['English', 'French']] as const,
    ['titleAndCode', ['English (EN)', 'French (FR)']] as const,
  ])('labels follow languageDisplay %s', (languageDisplay, labels) => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      languageDisplay,
    })

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  test('calls handleClick with the language id', () => {
    const handleClick = vi.fn()
    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={handleClick}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()
    fireEvent.click(screen.getByTestId('add-fr'))
    expect(handleClick).toHaveBeenCalledWith('fr')
  })

  test('calls onAddAll from the missing-translations item', () => {
    const onAddAll = vi.fn()
    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={onAddAll}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()
    fireEvent.click(screen.getByTestId('add-all-languages'))
    expect(onAddAll).toHaveBeenCalledTimes(1)
  })

  test('renders null when languages array is empty', () => {
    vi.mocked(useInternationalizedArrayContext).mockReturnValue({
      ...MOCK_INTERNATIONALIZED_ARRAY_CONTEXT,
      filteredLanguages: [],
    })

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.queryByTestId('add-buttons-grid')).not.toBeInTheDocument()
  })

  test('disables the trigger when readOnly', () => {
    render(
      <CompactAddButton
        readOnly={true}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('add-translation-menu')).toHaveAttribute('data-disabled', 'true')
  })
})
