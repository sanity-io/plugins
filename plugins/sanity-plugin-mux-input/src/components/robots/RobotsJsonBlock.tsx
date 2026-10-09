import {Card, Flex, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'

import {RobotsCopyButton} from './RobotsCopyButton'
import {RobotsNote} from './RobotsNote'

function prettyJson(value: unknown): string | undefined {
  try {
    const text = JSON.stringify(value, null, 2)
    return typeof text === 'string' && text.trim() !== '' ? text : undefined
  } catch {
    return undefined
  }
}

export function RobotsJsonBlock({value, what}: {value: unknown; what: string}) {
  const text = prettyJson(value)
  if (!text) {
    return (
      <RobotsNote tone="caution">
        There’s nothing to show as JSON: {what} came back empty or couldn’t be read.
      </RobotsNote>
    )
  }
  return (
    <Stack gap={2}>
      <Flex justify="flex-end">
        <RobotsCopyButton value={text} label="Copy the JSON" text="Copy" />
      </Flex>
      <Card
        padding={3}
        radius={2}
        tone="transparent"
        border
        overflow="auto"
        style={{maxHeight: '50vh'}}
      >
        <Code language="json" size={1}>
          {text}
        </Code>
      </Card>
    </Stack>
  )
}
