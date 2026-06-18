import {Box, Card, type CardTone, Stack, Text} from '@sanity/ui'
import type {ReactNode} from 'react'

interface PlaceholderDropzoneProps {
  title: string
  subtitle?: string
  isOver?: boolean
  canDrop?: boolean
  children?: ReactNode
}

const PlaceholderDropzone = (props: PlaceholderDropzoneProps) => {
  const isValid = props.isOver && props.canDrop
  const isInvalid = props.isOver && !props.canDrop
  let tone: CardTone = 'transparent'
  if (isValid) {
    tone = 'positive'
  }
  if (isInvalid) {
    tone = 'caution'
  }
  return (
    <Box padding={3}>
      <Card
        padding={5}
        radius={2}
        border
        tone={tone}
        style={{
          borderStyle: props.isOver ? undefined : 'dashed',
        }}
      >
        <Stack gap={2} style={{textAlign: 'center'}}>
          <Text size={2} as="h2" muted>
            {!props.isOver && props.title}
            {isValid && 'Drop here'}
            {isInvalid && 'Invalid location or element'}
          </Text>
          {props.subtitle && <Text size={1}>{props.subtitle}</Text>}
          {props.children}
        </Stack>
      </Card>
    </Box>
  )
}

export default PlaceholderDropzone
