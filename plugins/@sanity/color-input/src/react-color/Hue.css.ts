import {createVar, style, styleVariants} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const shadowVar = createVar()
export const pointerLeftVar = createVar()
export const pointerTopVar = createVar()

export const root = style({
  position: 'absolute',
  inset: 0,
  borderRadius: radiusVar,
  boxShadow: shadowVar,
})

export const gradient = styleVariants({
  horizontal: {
    background:
      'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
    padding: '0 2px',
    position: 'relative',
    height: '100%',
    borderRadius: radiusVar,
  },
  vertical: {
    background:
      'linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
    padding: '0 2px',
    position: 'relative',
    height: '100%',
    borderRadius: radiusVar,
  },
})

export const pointer = styleVariants({
  horizontal: {
    position: 'absolute',
    left: pointerLeftVar,
  },
  vertical: {
    position: 'absolute',
    left: '0px',
    top: pointerTopVar,
  },
})

export const pointerKnob = style({
  marginTop: '1px',
  width: '4px',
  borderRadius: '1px',
  height: '8px',
  boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
  background: '#fff',
  transform: 'translateX(-2px)',
})
