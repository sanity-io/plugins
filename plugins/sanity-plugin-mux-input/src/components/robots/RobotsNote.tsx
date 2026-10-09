import {Card, type CardTone, Stack, Text} from '@sanity/ui'
import type {ReactNode} from 'react'

export function RobotsNote({
  tone = 'transparent',
  children,
  action,
}: {
  tone?: CardTone
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <Card padding={3} radius={2} tone={tone} border>
      <Stack gap={3}>
        <Text size={1}>{children}</Text>
        {action}
      </Stack>
    </Card>
  )
}
