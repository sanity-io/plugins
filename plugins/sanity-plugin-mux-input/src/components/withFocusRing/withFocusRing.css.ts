import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const boxShadowVar = createVar()
export const boxShadowFocusVar = createVar()

export const focusRing = style({
  'borderRadius': radiusVar,
  'outline': 'none',
  'boxShadow': boxShadowVar,
  ':focus': {
    boxShadow: boxShadowFocusVar,
  },
})
