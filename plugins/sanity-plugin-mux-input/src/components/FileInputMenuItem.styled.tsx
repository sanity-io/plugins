import {MenuItem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'

import {focusRingStyle} from './withFocusRing/helpers'

import {boxShadowFocusVar, fileButton} from './FileInputMenuItem.css'

export function FileButton({className, style, ...props}: ComponentProps<typeof MenuItem>) {
  const theme = useThemeV2()
  const border = {width: 1, color: 'var(--card-border-color)'}

  return (
    <MenuItem
      {...props}
      className={clsx(fileButton, className)}
      style={{
        ...assignInlineVars({
          [boxShadowFocusVar]: focusRingStyle({
            base: theme.color,
            border,
            focusRing: theme.card.focusRing,
          }),
        }),
        ...style,
      }}
    />
  )
}
