import {createVar, style} from '@vanilla-extract/css'

export const backgroundColorVar = createVar()
export const opacityVar = createVar()

export const colorPreview = style({
  backgroundColor: backgroundColorVar,
  opacity: opacityVar,
  position: 'absolute',
  height: '100%',
  width: '100%',
  top: 0,
  left: 0,
})
