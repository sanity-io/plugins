import {rem} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import type {ComponentType} from 'react'
import {css, styled} from 'styled-components'

import {focusRingBorderStyle, focusRingStyle} from './helpers'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component as unknown as any)<Props & {$border?: boolean}>((props) => {
    const v2 = getTheme_v2(props.theme)
    const border = {
      width: props.$border ? 1 : 0,
      color: 'var(--card-border-color)',
    }

    return css`
      --card-focus-box-shadow: ${focusRingBorderStyle(border)};

      border-radius: ${rem(v2.radius[1]!)};
      outline: none;
      box-shadow: var(--card-focus-box-shadow);

      &:focus {
        --card-focus-box-shadow: ${focusRingStyle({
          base: {bg: v2.color.bg},
          border,
          focusRing: v2.card.focusRing,
        })};
      }
    `
  })
}
