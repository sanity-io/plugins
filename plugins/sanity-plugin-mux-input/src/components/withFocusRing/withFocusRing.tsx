import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import type {ComponentType, CSSProperties} from 'react'

import {focusRingBorderStyle, focusRingStyle} from './helpers'

import {boxShadowFocusVar, boxShadowVar, focusRing, radiusVar} from './withFocusRing.css'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  const Component = component

  return function WithFocusRing(
    props: Props & {border?: boolean; className?: string; style?: CSSProperties},
  ) {
    const {border, className, style, ...rest} = props
    const theme = useThemeV2()
    const borderOpts = {
      width: border ? 1 : 0,
      color: 'var(--card-border-color)',
    }

    return (
      <Component
        {...(rest as Props)}
        className={clsx(focusRing, className)}
        style={{
          ...assignInlineVars({
            [radiusVar]: `${rem(theme.radius[1]!)}`,
            [boxShadowVar]: focusRingBorderStyle(borderOpts),
            [boxShadowFocusVar]: focusRingStyle({
              base: theme.color,
              border: borderOpts,
              focusRing: theme.card.focusRing,
            }),
          }),
          ...style,
        }}
      />
    )
  }
}
