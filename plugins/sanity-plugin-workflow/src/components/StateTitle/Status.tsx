import {Box, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'

type StatusProps = {
  text: string
  icon: React.ComponentType
}

export function Status(props: StatusProps) {
  const {text, icon} = props
  const Icon = icon

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>{text}</Text>
        </Box>
      }
    >
      <Text size={1}>
        <Icon />
      </Text>
    </Tooltip>
  )
}
