import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type ReactElement, useCallback, useMemo} from 'react'
import {set} from 'sanity'

import type {Language, InternationalizedArrayItem} from '../types'

import {LANGUAGE_FIELD_NAME} from '../constants'

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
export function MigrationBanner({
  value,
  languages,
  onChange,
  readOnly = false,
}: MigrationBannerProps): ReactElement | null {
  const toast = useToast()

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

  // Handler to migrate items from old format to new format
  const handleMigrateLanguages = useCallback(() => {
    if (!value?.length || !needsMigration) {
      return
    }

    const languageIds = new Set(languages.map((l) => l.id))

    // Create updated value array with migrated items
    const updatedValue = value.map((item) => {
      // Check if this item needs migration
      const needsItemMigration =
        item._key && languageIds.has(item._key) && !item[LANGUAGE_FIELD_NAME as keyof typeof item]

      if (needsItemMigration) {
        // Migrate: copy _key to language field, generate new random _key
        return {
          ...item,
          _key: randomKey(),
          [LANGUAGE_FIELD_NAME]: item._key,
        }
      }

      return item
    })

    onChange([set(updatedValue)])
    toast.push({
      title: `Updated ${itemsNeedingMigration.length} item${itemsNeedingMigration.length === 1 ? '' : 's'} to new format`,
      status: 'success',
    })
  }, [value, languages, needsMigration, onChange, toast, itemsNeedingMigration.length])

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
            Data format update required
          </Text>
          <Text size={1} muted>
            {itemsNeedingMigration.length} item
            {itemsNeedingMigration.length === 1 ? '' : 's'} need
            {itemsNeedingMigration.length === 1 ? 's' : ''} to be updated to the new format.
          </Text>
        </Stack>
        <Button
          tone="caution"
          mode="ghost"
          text="Update Languages"
          onClick={handleMigrateLanguages}
          disabled={readOnly}
        />
      </Flex>
    </Card>
  )
}

/**
 * Utility function to check if a value array has items that need migration.
 * Useful for conditional logic outside of the component.
 */
export function hasItemsNeedingMigration(
  value: InternationalizedArrayItem[] | undefined,
  languages: Language[],
): boolean {
  if (!value?.length || !languages?.length) {
    return false
  }

  const languageIds = new Set(languages.map((l) => l.id))
  return value.some(
    (item) =>
      item._key && languageIds.has(item._key) && !item[LANGUAGE_FIELD_NAME as keyof typeof item],
  )
}
