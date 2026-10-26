import {globalStyle, style} from '@vanilla-extract/css'

/**
 * Center the collapse chevron on the language label.
 *
 * Studio's legend toggle is a flex row with no cross-axis alignment. The
 * chevron lives in a 9px box, so it sits on the start of that row, below the
 * language label.
 */
export const languageRow = style({})

globalStyle(`${languageRow} button:has([data-sanity-icon="toggle-arrow-right"])`, {
  alignItems: 'center',
})
