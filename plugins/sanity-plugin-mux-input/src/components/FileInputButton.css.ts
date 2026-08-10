import {style} from '@vanilla-extract/css'

export const hiddenInput = style({
  overflow: 'hidden',
  width: '0.1px',
  height: '0.1px',
  opacity: 0,
  position: 'absolute',
  zIndex: -1,
})

export const label = style({
  position: 'relative',
})
