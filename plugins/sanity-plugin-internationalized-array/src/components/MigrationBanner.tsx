import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactElement} from 'react'

import type {InternationalizedArrayItem} from '../types'

export type MigrationBannerProps = {
  itemsNeedingMigration: InternationalizedArrayItem[]
}

/**
 * Migration banner component that displays a warning if the items need to be migrated to the v5 format.
 */
export function MigrationBanner({
  itemsNeedingMigration,
}: MigrationBannerProps): ReactElement | null {
  // Don't render if no migration is needed
  if (!itemsNeedingMigration.length) {
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
