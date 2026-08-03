import {Card} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

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
  pointer-events: none;

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
  pointer-events: none;

  [data-ui='Text'] {
    color: var(--durationline-fg);
  }
`
