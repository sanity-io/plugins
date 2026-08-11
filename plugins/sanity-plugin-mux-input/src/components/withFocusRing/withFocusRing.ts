import {rem, type Theme} from '@sanity/ui'
import type {ComponentType} from 'react'
import {css, styled} from 'styled-components'

import {focusRingBorderStyle, focusRingStyle} from './helpers'

type FocusRingProps = {
  $border?: boolean
  theme: Theme
}

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component as ComponentType<Record<string, unknown>>)<FocusRingProps>((props) => {
    const {$border, theme} = props
    const border = {
      width: $border ? 1 : 0,
      color: 'var(--card-border-color)',
    }

    return css`
      --card-focus-box-shadow: ${focusRingBorderStyle(border)};

      border-radius: ${rem(theme.sanity.radius[1]!)};
      outline: none;
      box-shadow: var(--card-focus-box-shadow);

      &:focus {
        --card-focus-box-shadow: ${focusRingStyle({
          base: theme.sanity.color.base,
          border,
          focusRing: theme.sanity.focusRing,
        })};
      }
    `
  })
}
