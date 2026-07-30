import {createVar, style, styleVariants} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const shadowVar = createVar()
export const gradientVar = createVar()
export const pointerLeftVar = createVar()
export const pointerTopVar = createVar()

export const root = style({
  position: 'absolute',
  inset: 0,
  borderRadius: radiusVar,
})

export const checkboardLayer = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  borderRadius: radiusVar,
})

export const gradientLayer = style({
  position: 'absolute',
  inset: 0,
  background: gradientVar,
  boxShadow: shadowVar,
  borderRadius: radiusVar,
})

export const container = style({
  position: 'relative',
  height: '100%',
  margin: '0 3px',
})

export const pointer = styleVariants({
  horizontal: {
    position: 'absolute',
    left: pointerLeftVar,
  },
  vertical: {
    position: 'absolute',
    left: 0,
    top: pointerTopVar,
  },
})

export const pointerKnob = style({
  width: '4px',
  borderRadius: '1px',
  height: '8px',
  boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
  background: '#fff',
  marginTop: '1px',
  transform: 'translateX(-2px)',
})
