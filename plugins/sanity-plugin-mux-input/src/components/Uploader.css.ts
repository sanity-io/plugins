import {style} from '@vanilla-extract/css'

export const hiddenInput = style({
  'position': 'absolute',
  'border': 0,
  'color': 'white',
  'opacity': 0,
  ':focus': {
    outline: 'none',
  },
})
