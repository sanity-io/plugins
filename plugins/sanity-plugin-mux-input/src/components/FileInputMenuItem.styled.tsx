import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {MenuItem} from '@sanity/ui/menu'
import {type ComponentProps, type CSSProperties} from 'react'

import {focusRingStyle} from './withFocusRing/helpers'

import * as styles from './FileInputMenuItem.module.css'

interface FileButtonStyle extends CSSProperties {
  '--mux-file-button-focus-box-shadow': string
}

export function FileButton({className, style, ...props}: ComponentProps<typeof MenuItem>) {
  const theme = useThemeV2()
  const border = {width: 1, color: 'var(--card-border-color)'}
  const focusButtonStyle: FileButtonStyle = {
    '--mux-file-button-focus-box-shadow': focusRingStyle({
      base: theme.color,
      border,
      focusRing: theme.card.focusRing,
    }),
  }

  return (
    <MenuItem
      {...props}
      className={className ? `${styles.fileButton} ${className}` : styles.fileButton}
      style={{...focusButtonStyle, ...style}}
    />
  )
}
