import {style} from '@vanilla-extract/css'

export const importButton = style({
  selectors: {
    // Override Button's own width so the control fills the grid cell.
    '&&': {
      width: '100%',
    },
  },
})
