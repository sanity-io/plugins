import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ThemeWrapper} from '../test/component-helpers'
import type {InternationalizedArrayItem} from '../types'
import {MigrationBanner, type MigrationBannerProps} from './MigrationBanner'
// Helper to create old format value (language in _key, no language field)
function createOldFormatValue(languageId: string, content?: unknown): InternationalizedArrayItem {
  // Cast needed because Value type now requires language field
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    _key: languageId,
    value: content,
  } as InternationalizedArrayItem
}

function renderMigrationBanner(props: Partial<MigrationBannerProps> = {}) {
  const defaultProps: MigrationBannerProps = {
    itemsNeedingMigration: [],
    ...props,
  }

  return {
    ...render(<MigrationBanner {...defaultProps} />, {wrapper: ThemeWrapper}),
  }
}

describe('MigrationBanner', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('does not render when no migration is needed', () => {
    it('returns null when itemsNeedingMigration is empty', () => {
      renderMigrationBanner({itemsNeedingMigration: []})

      expect(screen.queryByText('Data migration required')).not.toBeInTheDocument()
    })
  })

  describe('renders when migration is needed', () => {
    it('renders banner for a single item needing migration', () => {
      const itemsNeedingMigration = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({itemsNeedingMigration})

      expect(screen.getByText('Data migration required')).toBeInTheDocument()
    })

    it('renders banner for multiple items needing migration', () => {
      const itemsNeedingMigration = [
        createOldFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({itemsNeedingMigration})

      expect(screen.getByText('Data migration required')).toBeInTheDocument()
    })
  })

  describe('displays correct item count', () => {
    it('shows singular form for 1 item', () => {
      const itemsNeedingMigration = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({itemsNeedingMigration})

      expect(screen.getByText('1 item needs to be migrated to the v5 format.')).toBeInTheDocument()
    })

    it('shows plural form for multiple items', () => {
      const itemsNeedingMigration = [
        createOldFormatValue('en', 'Hello'),
        createOldFormatValue('fr', 'Bonjour'),
        createOldFormatValue('de', 'Hallo'),
      ]

      renderMigrationBanner({itemsNeedingMigration})

      expect(screen.getByText('3 items need to be migrated to the v5 format.')).toBeInTheDocument()
    })
  })

  describe('learn more link', () => {
    it('renders a link to migration docs', () => {
      const itemsNeedingMigration = [createOldFormatValue('en', 'Hello')]

      renderMigrationBanner({itemsNeedingMigration})

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
