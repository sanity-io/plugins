import {Card} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

export const Root = styled.div`
  ${({theme}) => {
    const v2 = getTheme_v2({sanity: theme.sanity})
    return `
      background-color: ${v2.color.muted.bg};
      border: 1px solid ${v2.color.border};
    `
  }};
  overflow: hidden;
  background-origin: content-box;
  background-repeat: no-repeat;
  background-clip: border-box;
  background-size: cover;
  position: relative;
  outline: none !important;
  box-sizing: content-box;
  user-drag: none;

  &:hover {
    opacity: 0.85;
  }

  &:focus,
  &:active {
    border: 1px solid var(--input-border-color-focus);
    box-shadow: inset 0 0 0 3px var(--input-border-color-focus);
  }
`

export const InfoLine = styled(Card)`
  ${({theme}) => {
    const v2 = getTheme_v2({sanity: theme.sanity})
    return `
      --infoline-fg: ${v2.color.fg};
      --infoline-bg: ${v2.color.bg};
    `
  }};
  user-drag: none;
  position: absolute;
  background-color: var(--infoline-bg);
  top: 0;
  left: 0;
  max-width: 65%;
  overflow-wrap: break-word;

  [data-ui='Text'] {
    color: var(--infoline-fg);
  }
`

export const DurationLine = styled(Card)`
  ${({theme}) => {
    const v2 = getTheme_v2({sanity: theme.sanity})
    return `
      --durationline-fg: ${v2.color.bg};
      --durationline-bg: ${v2.color.fg};
    `
  }};
  user-drag: none;
  position: absolute;
  background-color: var(--durationline-bg);
  top: 0;
  right: 0;

  [data-ui='Text'] {
    color: var(--durationline-fg);
  }
`
