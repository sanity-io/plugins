import {style} from '@vanilla-extract/css'

import {PANEL_HEIGHT} from '../../constants'

export const tagContainer = style({
  height: `${PANEL_HEIGHT}px`,
})

export const buttonContainer = style({
  '@media': {
    '(pointer: fine)': {
      visibility: 'hidden',
    },
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        [`${tagContainer}:hover &`]: {
          visibility: 'visible',
        },
      },
    },
  },
})
