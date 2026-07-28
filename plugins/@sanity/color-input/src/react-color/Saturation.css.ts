import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const shadowVar = createVar()
export const hueBackgroundVar = createVar()
export const pointerTopVar = createVar()
export const pointerLeftVar = createVar()

export const root = style({
  position: 'absolute',
  inset: 0,
  background: hueBackgroundVar,
  borderRadius: radiusVar,
})

export const white = style({
  position: 'absolute',
  inset: 0,
  borderRadius: radiusVar,
  background: 'linear-gradient(to right, #fff, rgba(255, 255, 255, 0))',
})

export const black = style({
  position: 'absolute',
  inset: 0,
  boxShadow: shadowVar,
  borderRadius: radiusVar,
  background: 'linear-gradient(to top, #000, rgba(0, 0, 0, 0))',
})

export const pointer = style({
  position: 'absolute',
  top: pointerTopVar,
  left: pointerLeftVar,
  cursor: 'default',
})

export const pointerKnob = style({
  width: '4px',
  height: '4px',
  boxShadow: '0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3), 0 0 1px 2px rgba(0,0,0,.4)',
  borderRadius: '50%',
  cursor: 'pointer',
  transform: 'translate(-2px, -2px)',
})
