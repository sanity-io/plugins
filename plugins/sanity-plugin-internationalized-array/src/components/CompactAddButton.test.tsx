import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import {MOCK_INTERNATIONALIZED_ARRAY_CONTEXT} from '../test/helpers'
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
    const languagesInUse = ['en', 'fr', 'es', 'de']

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={languagesInUse}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
        buttonAddAll
        addAllTitle="Add missing languages"
        allLanguagesArePresent
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('add-translation-menu')).toBeInTheDocument()
    expect(screen.getByTestId('field-menu')).toBeInTheDocument()
  })

  test('disables present languages and leaves missing ones enabled', () => {
    const languagesInUse = ['en', 'fr']

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={languagesInUse}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
        buttonAddAll
        addAllTitle="Add missing languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.getByTestId('field-menu-add-en')).toBeDisabled()
    expect(screen.getByTestId('field-menu-add-fr')).toBeDisabled()
    expect(screen.getByTestId('field-menu-add-es')).toBeEnabled()
    expect(screen.getByTestId('field-menu-add-de')).toBeEnabled()
  })

  test('disables the bulk item when nothing is missing', () => {
    const languagesInUse = ['en', 'fr', 'es', 'de']

    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={languagesInUse}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
        buttonAddAll
        addAllTitle="Add missing languages"
        allLanguagesArePresent
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.getByTestId('field-menu-add-all')).toBeDisabled()
  })

  test('enables the bulk item when languages are missing', () => {
    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
        buttonAddAll
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.getByTestId('field-menu-add-all')).toBeEnabled()
  })

  test('hides the bulk item when buttonAddAll is false', () => {
    render(
      <CompactAddButton
        readOnly={false}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
        buttonAddAll={false}
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()

    expect(screen.queryByTestId('field-menu-add-all')).not.toBeInTheDocument()
    expect(screen.getByTestId('field-menu-add-en')).toBeInTheDocument()
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
        buttonAddAll
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
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
        buttonAddAll
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()
    fireEvent.click(screen.getByTestId('field-menu-add-fr'))
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
        buttonAddAll
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    openMenu()
    fireEvent.click(screen.getByTestId('field-menu-add-all'))
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
        buttonAddAll
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.queryByTestId('field-menu')).not.toBeInTheDocument()
  })

  test('disables the trigger when readOnly', () => {
    render(
      <CompactAddButton
        readOnly={true}
        languagesInUse={[]}
        handleClick={vi.fn()}
        onAddAll={vi.fn()}
        buttonAddAll
        addAllTitle="Add all languages"
        allLanguagesArePresent={false}
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('add-translation-menu')).toHaveAttribute('data-disabled', 'true')
  })
})
