import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card, Flex, Text} from '@sanity/ui'
import {useFormValue} from 'sanity'

/**
 * Decorative banner injected via `renderMembers` that warns editors when a
 * product or category is offline in SFCC.
 *
 * Reads `store.onlineFlag` (products) and `store.online` (categories) via
 * `useFormValue` so it works without props.
 */
export function SfccOfflineBanner() {
  const onlineFlagRaw = useFormValue(['store', 'onlineFlag'])
  const onlineRaw = useFormValue(['store', 'online'])

  const onlineFlag = typeof onlineFlagRaw === 'boolean' ? onlineFlagRaw : undefined
  const online = typeof onlineRaw === 'boolean' ? onlineRaw : undefined
  const isOnline = onlineFlag ?? online

  if (isOnline !== false) return null

  return (
    <Card padding={4} radius={2} shadow={1} tone="caution">
      <Flex align="center" gap={3}>
        <Text size={2}>
          <WarningOutlineIcon />
        </Text>
        <Text size={1} weight="medium">
          This document is currently offline in SFCC.
        </Text>
      </Flex>
    </Card>
  )
}
