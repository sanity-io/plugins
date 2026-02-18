import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactElement, useMemo} from 'react'
import {set} from 'sanity'

import {LANGUAGE_FIELD_NAME} from '../constants'
import type {Language, InternationalizedArrayItem} from '../types'

export type MigrationBannerProps = {
  /** Current array value */
  value: InternationalizedArrayItem[] | undefined
  /** Registered languages from plugin config */
  languages: Language[]
  /** onChange handler to update the field value */
  onChange: (patches: ReturnType<typeof set>[]) => void
  /** Whether the field is read-only */
  readOnly?: boolean
}

/**
 * Migration banner component that detects and helps migrate items from
 * the old data format (language stored in `_key`) to the new format
 * (language stored in dedicated `language` field).
 *
 * The component automatically determines whether to render based on
 * whether any items need migration.
 *
 * @example
 * ```tsx
 * <MigrationBanner
 *   value={value}
 *   languages={languages}
 *   onChange={onChange}
 *   readOnly={readOnly}
 * />
 * ```
 */
export function MigrationBanner({value, languages}: MigrationBannerProps): ReactElement | null {
  // Detect items that need migration from old format (_key as language) to new format (language field)
  // An item needs migration if:
  // 1. It has a _key that matches a valid language ID
  // 2. It doesn't have a language field set
  const itemsNeedingMigration = useMemo(() => {
    if (!value?.length || !languages?.length) {
      return []
    }

    const languageIds = new Set(languages.map((l) => l.id))
    return value.filter(
      (item) =>
        item._key && languageIds.has(item._key) && !item[LANGUAGE_FIELD_NAME as keyof typeof item],
    )
  }, [value, languages])

  const needsMigration = itemsNeedingMigration.length > 0
  // Don't render if no migration is needed
  if (!needsMigration) {
    return null
  }

  return (
    <Card tone="caution" padding={3} radius={2} border>
      <Flex gap={3} align="center">
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={2} flex={1}>
          <Text size={1} weight="semibold">
            Data migration required
          </Text>
          <Text size={1} muted>
            {itemsNeedingMigration.length} item
            {itemsNeedingMigration.length === 1 ? '' : 's'}{' '}
            {itemsNeedingMigration.length === 1 ? 'needs' : 'need'} to be migrated to the v5 format.
          </Text>
          <Box marginTop={2}>
            <Text size={1}>
              This field still uses the v4 format where language is stored in <code>_key</code>.
              Migrate to the v5 format where language is stored in <code>language</code>.{' '}
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/README.md#migrate-from-v4-to-v5"
              >
                Learn more
              </a>
              .
            </Text>
          </Box>
        </Stack>
      </Flex>
    </Card>
  )
}
