import {style} from '@vanilla-extract/css'

export const fullWidthButton = style({
  selectors: {
    // Match the previous inline `width: 100%` against Button's own width rules.
    '&&': {
      width: '100%',
    },
  },
})
