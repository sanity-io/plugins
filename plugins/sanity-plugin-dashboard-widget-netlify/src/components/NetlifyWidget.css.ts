import {style} from '@vanilla-extract/css'

export const contentCard = style({
  selectors: {
    // Double specificity so this wins over Card/Box's own `min-height: 0`
    // (styled-components used to win via CSSOM insertion order).
    '&&': {
      minHeight: 66,
    },
  },
})
