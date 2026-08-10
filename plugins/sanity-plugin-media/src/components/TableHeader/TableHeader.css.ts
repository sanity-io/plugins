import {createVar, style} from '@vanilla-extract/css'

export const hoverBgVar = createVar()

export const contextActionContainer = style({
  'cursor': 'pointer',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          background: hoverBgVar,
        },
      },
    },
  },
})
