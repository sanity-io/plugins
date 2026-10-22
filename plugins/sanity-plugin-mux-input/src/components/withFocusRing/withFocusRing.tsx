import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import type {ComponentType, CSSProperties} from 'react'

import {focusRingBorderStyle, focusRingStyle} from './helpers'

import * as styles from './withFocusRing.module.css'

/** React's `CSSProperties` does not know custom properties, so the inline `style` is typed through this extension of it. */
interface FocusRingStyle extends CSSProperties {
  '--mux-focus-radius': string
  '--mux-focus-box-shadow': string
  '--mux-focus-box-shadow-focus': string
}

export function withFocusRing<Props extends object>(component: ComponentType<Props>) {
  const Component = component

  return function WithFocusRing({
    border,
    className,
    style,
    ...props
  }: Props & {border?: boolean; className?: string; style?: CSSProperties}) {
    const theme = useThemeV2()
    const borderOpts = {
      width: border ? 1 : 0,
      color: 'var(--card-border-color)',
    }
    const focusRingStyleVars: FocusRingStyle = {
      '--mux-focus-radius': `${rem(theme.radius[1]!)}`,
      '--mux-focus-box-shadow': focusRingBorderStyle(borderOpts),
      '--mux-focus-box-shadow-focus': focusRingStyle({
        base: theme.color,
        border: borderOpts,
        focusRing: theme.card.focusRing,
      }),
    }

    return (
      <Component
        {...(props as Props)}
        className={className ? `${styles.focusRing} ${className}` : styles.focusRing}
        style={{...focusRingStyleVars, ...style}}
      />
    )
  }
}
