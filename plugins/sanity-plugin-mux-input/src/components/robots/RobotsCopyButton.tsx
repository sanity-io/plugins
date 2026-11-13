import {CopyIcon} from '@sanity/icons/Copy'
import {Box, Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'

/** Copies `value`. With `text` it's a labelled button, without it an icon that names itself. */
export function RobotsCopyButton({
  value,
  label,
  text,
}: {
  value: string
  label: string
  text?: string
}) {
  const button = (
    <Button
      icon={CopyIcon}
      text={text}
      aria-label={label}
      mode="bleed"
      fontSize={1}
      padding={2}
      onClick={() => void navigator.clipboard?.writeText(value)}
    />
  )
  if (text) return button
  return (
    <Tooltip
      animate
      portal
      content={
        <Box padding={2}>
          <Text size={1}>{label}</Text>
        </Box>
      }
    >
      {button}
    </Tooltip>
  )
}
