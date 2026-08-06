import {globalStyle, style} from '@vanilla-extract/css'

export const topControls = style({
  position: 'absolute',
  top: 0,
  right: 0,
  justifyContent: 'flex-end',
})

globalStyle(`${topControls} button`, {
  height: 'auto',
})
