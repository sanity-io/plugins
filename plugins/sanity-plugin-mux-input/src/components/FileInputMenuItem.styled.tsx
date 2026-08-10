import {MenuItem} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {focusRingStyle} from './withFocusRing/helpers'

export const FileButton = styled(MenuItem)(({theme}) => {
  const v2 = getTheme_v2(theme)
  const focusRing = v2.button.focusRing
  const base = {bg: v2.color.bg}
  const border = {width: 1, color: 'var(--card-border-color)'}

  return css`
    position: relative;

    &:not([data-disabled='true']) {
      &:focus-within {
        box-shadow: ${focusRingStyle({base, border, focusRing})};
      }
    }

    & input {
      overflow: hidden;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      min-width: 0;
      display: block;
      appearance: none;
      padding: 0;
      margin: 0;
      border: 0;
      opacity: 0;
    }
  `
})
