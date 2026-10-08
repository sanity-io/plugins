import {Box, Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import type {ComponentProps, CSSProperties} from 'react'

/**
 * A button that says why it's disabled. A disabled button gets no hover events, so the tooltip
 * sits on a wrapper and the button lets the pointer through to it.
 */
export function RobotsReasonButton({
  disabledReason,
  style,
  ...props
}: Omit<ComponentProps<typeof Button>, 'disabled' | 'style'> & {
  disabledReason?: string | undefined
  style?: CSSProperties
}) {
  if (!disabledReason) return <Button {...props} style={style} />
  return (
    <Tooltip
      animate
      portal
      content={
        <Box padding={2} style={{maxWidth: '20rem'}}>
          <Text size={1}>{disabledReason}</Text>
        </Box>
      }
    >
      <span style={{display: 'inline-flex'}}>
        <Button {...props} disabled style={{...style, pointerEvents: 'none'}} />
      </span>
    </Tooltip>
  )
}
