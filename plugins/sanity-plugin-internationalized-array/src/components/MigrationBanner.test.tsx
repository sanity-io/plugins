import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import type {Language, InternationalizedArrayItem} from '../types'
import {MigrationBanner, type MigrationBannerProps} from './MigrationBanner'

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

      expect(screen.queryByText('Data migration required')).not.toBeInTheDocument()
    })

    it('returns null for empty value array', () => {
      renderMigrationBanner({value: []})

      expect(screen.queryByText('Data migration required')).not.toBeInTheDocument()
    })

    it('returns null when all items are in new format', () => {
      const value = [createNewFormatValue('en', 'Hello'), createNewFormatValue('fr', 'Bonjour')]

      renderMigrationBanner({value})

      expect(screen.queryByText('Data migration required')).not.toBeInTheDocument()
    })

    it('returns null when _key does not match any language ID', () => {
      const value = [createOldFormatValue('en-random', 'Hello')]

      renderMigrationBanner({value})

      expect(screen.queryByText('Data migration required')).not.toBeInTheDocument()
    })

    it('returns null with empty languages array', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value, languages: []})

      expect(screen.queryByText('Data migration required')).not.toBeInTheDocument()
    })
  })

  describe('renders when migration is needed', () => {
    it('renders banner for single old format item', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value})

      expect(screen.getByText('Data migration required')).toBeInTheDocument()
    })

    it('renders banner for multiple old format items', () => {
      const value = [
        createOldFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({value})

      expect(screen.getByText('Data migration required')).toBeInTheDocument()
    })

    it('renders banner for mixed old and new format items', () => {
      const value = [createNewFormatValue('en', 'Hello'), createOldFormatValue('fr', 'Bonjour')]

      renderMigrationBanner({value})

      expect(screen.getByText('Data migration required')).toBeInTheDocument()
    })
  })

  describe('displays correct item count', () => {
    it('shows singular form for 1 item', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value})

      expect(screen.getByText('1 item needs to be migrated to the v5 format.')).toBeInTheDocument()
    })

    it('shows plural form for multiple items', () => {
      const value = [
        createOldFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({value})

      expect(screen.getByText('3 items need to be migrated to the v5 format.')).toBeInTheDocument()
    })

    it('only counts items needing migration in mixed array', () => {
      const value = [
        createNewFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({value})

      expect(screen.getByText('2 items need to be migrated to the v5 format.')).toBeInTheDocument()
    })
  })

  describe('learn more link', () => {
    it('renders a link to migration docs', () => {
      const value = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({value})

      const learnMoreLink = screen.getByRole('link', {name: 'Learn more'})
      expect(learnMoreLink).toBeInTheDocument()
      expect(learnMoreLink).toHaveAttribute(
        'href',
        'https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/README.md#migrate-from-v4-to-v5',
      )
      expect(learnMoreLink).toHaveAttribute('target', '_blank')
    })
  })
})
