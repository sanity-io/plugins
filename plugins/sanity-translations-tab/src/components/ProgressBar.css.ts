import {createVar, style} from '@vanilla-extract/css'

export const scaleXVar = createVar()

export const root = style({
  width: '100%',
  position: 'relative',
})

export const labelOverlay = style({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
})

export const bar = style({
  width: '100%',
  transform: `scaleX(${scaleXVar})`,
  transformOrigin: 'left',
  transition: 'transform .2s ease',
  boxSizing: 'border-box',
})
