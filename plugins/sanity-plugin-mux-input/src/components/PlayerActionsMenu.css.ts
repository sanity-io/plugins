import {style} from '@vanilla-extract/css'

export const lockCard = style({
  position: 'absolute',
  top: 0,
  left: 0,
  opacity: 0.6,
  mixBlendMode: 'screen',
  background: 'transparent',
})

export const lockButton = style({
  background: 'transparent',
  color: 'white',
})
