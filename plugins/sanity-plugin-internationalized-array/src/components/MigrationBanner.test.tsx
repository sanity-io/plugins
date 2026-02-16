import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import type {Language, InternationalizedArrayItem} from '../types'
import {MigrationBanner, type MigrationBannerProps} from './MigrationBanner'

// Mock @sanity/uuid for deterministic _key generation
vi.mock('@sanity/util/content', () => ({
  randomKey: vi.fn(() => 'mocked-randomKey-key'),
}))

// Test fixtures
const testLanguages: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'},
  {id: 'de', title: 'German'},
]

// Helper to create old format value (language in _key, no language field)
function createOldFormatValue(languageId: string, content?: unknown): InternationalizedArrayItem {
  // Cast needed because Value type now requires language field
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    _key: languageId,
    value: content,
  } as InternationalizedArrayItem
}

// Helper to create new format value (random _key, language in dedicated field)
function createNewFormatValue(languageId: string, content?: unknown): InternationalizedArrayItem {
  return {
    _key: `random-${languageId}-${Math.random().toString(36).slice(2)}`,
    language: languageId,
    value: content,
    _type: 'internationalizedArrayStringValue',
  }
}

function renderMigrationBanner(props: Partial<MigrationBannerProps> = {}) {
  const onChange = vi.fn()
  const defaultProps: MigrationBannerProps = {
    value: undefined,
    languages: testLanguages,
    onChange,
    readOnly: false,
    ...props,
  }

  return {
    ...render(<MigrationBanner {...defaultProps} />, {wrapper: ThemeWrapper}),
    onChange,
  }
}

describe('MigrationBanner', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('does not render when no migration is needed', () => {
    it('returns null for undefined value', () => {
      renderMigrationBanner({value: undefined})

      expect(screen.queryByText('Data format update required')).not.toBeInTheDocument()
    })

    it('returns null for empty value array', () => {
      renderMigrationBanner({value: []})

      expect(screen.queryByText('Data format update required')).not.toBeInTheDocument()
    })

    it('returns null when all items are in new format', () => {
      const value = [createNewFormatValue('en', 'Hello'), createNewFormatValue('fr', 'Bonjour')]

      renderMigrationBanner({value})

      expect(screen.queryByText('Data format update required')).not.toBeInTheDocument()
    })

    it('returns null when _key does not match any language ID', () => {
      const value = [createOldFormatValue('en-random', 'Hello')]

      renderMigrationBanner({value})

      expect(screen.queryByText('Data format update required')).not.toBeInTheDocument()
    })

    it('returns null with empty languages array', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value, languages: []})

      expect(screen.queryByText('Data format update required')).not.toBeInTheDocument()
    })
  })

  describe('renders when migration is needed', () => {
    it('renders banner for single old format item', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value})

      expect(screen.getByText('Data format update required')).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Update Languages'})).toBeInTheDocument()
    })

    it('renders banner for multiple old format items', () => {
      const value = [
        createOldFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({value})

      expect(screen.getByText('Data format update required')).toBeInTheDocument()
    })

    it('renders banner for mixed old and new format items', () => {
      const value = [createNewFormatValue('en', 'Hello'), createOldFormatValue('fr', 'Bonjour')]

      renderMigrationBanner({value})

      expect(screen.getByText('Data format update required')).toBeInTheDocument()
    })
  })

  describe('displays correct item count', () => {
    it('shows singular form for 1 item', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value})

      expect(screen.getByText('1 item needs to be updated to the new format.')).toBeInTheDocument()
    })

    it('shows plural form for multiple items', () => {
      const value = [
        createOldFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({value})

      expect(screen.getByText('3 items need to be updated to the new format.')).toBeInTheDocument()
    })

    it('only counts items needing migration in mixed array', () => {
      const value = [
        createNewFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({value})

      expect(screen.getByText('2 items need to be updated to the new format.')).toBeInTheDocument()
    })
  })

  describe('button click calls onChange with correct values', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('migrates single item correctly', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      const {onChange} = renderMigrationBanner({value})

      fireEvent.click(screen.getByRole('button', {name: 'Update Languages'}))

      expect(onChange).toHaveBeenCalledTimes(1)

      // Get the patches array passed to onChange
      const patchesArray = onChange.mock.calls[0]?.[0]
      // Get the first patch (the set patch) and extract its value
      const setPatch = patchesArray[0]
      const updatedValue = setPatch.value

      // Verify migration: _key changed to mocked value, language field set to old _key
      expect(updatedValue).toHaveLength(1)
      expect(updatedValue[0]._key).toBe('mocked-randomKey-key')
      expect(updatedValue[0].language).toBe('en')
      expect(updatedValue[0].value).toBe('Hello')
    })

    it('migrates multiple items correctly', () => {
      const value = [createOldFormatValue('en', 'Hello'), createOldFormatValue('fr', 'Bonjour')]

      const {onChange} = renderMigrationBanner({value})

      fireEvent.click(screen.getByRole('button', {name: 'Update Languages'}))

      expect(onChange).toHaveBeenCalledTimes(1)

      const patchesArray = onChange.mock.calls[0]?.[0]
      const setPatch = patchesArray[0]
      const updatedValue = setPatch.value

      expect(updatedValue).toHaveLength(2)
      expect(updatedValue[0].language).toBe('en')
      expect(updatedValue[1].language).toBe('fr')
    })

    it('preserves existing fields during migration', () => {
      const value = [
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        {
          _key: 'en',
          value: 'Hello',
          _type: 'internationalizedArrayStringValue',
        } as unknown as InternationalizedArrayItem,
      ]

      const {onChange} = renderMigrationBanner({value})

      fireEvent.click(screen.getByRole('button', {name: 'Update Languages'}))

      const patchesArray = onChange.mock.calls[0]?.[0]
      const setPatch = patchesArray[0]
      const updatedValue = setPatch.value

      expect(updatedValue[0]._type).toBe('internationalizedArrayStringValue')
      expect(updatedValue[0].value).toBe('Hello')
      expect(updatedValue[0].language).toBe('en')
    })

    it('does not modify already migrated items', () => {
      const newFormatItem = createNewFormatValue('en', 'Hello')
      const originalKey = newFormatItem._key

      const value = [newFormatItem, createOldFormatValue('fr', 'Bonjour')]

      const {onChange} = renderMigrationBanner({value})

      fireEvent.click(screen.getByRole('button', {name: 'Update Languages'}))

      const patchesArray = onChange.mock.calls[0]?.[0]
      const setPatch = patchesArray[0]
      const updatedValue = setPatch.value

      // First item (already migrated) should be unchanged
      expect(updatedValue[0]._key).toBe(originalKey)
      expect(updatedValue[0].language).toBe('en')

      // Second item (old format) should be migrated
      expect(updatedValue[1]._key).toBe('mocked-randomKey-key')
      expect(updatedValue[1].language).toBe('fr')
    })
  })

  describe('readOnly behavior', () => {
    it('disables button when readOnly is true', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value, readOnly: true})

      const button = screen.getByRole('button', {name: 'Update Languages'})
      expect(button).toBeDisabled()
    })

    it('enables button when readOnly is false', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value, readOnly: false})

      const button = screen.getByRole('button', {name: 'Update Languages'})
      expect(button).not.toBeDisabled()
    })
  })
})
