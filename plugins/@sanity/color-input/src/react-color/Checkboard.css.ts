import {createVar, style} from '@vanilla-extract/css'

export const borderRadiusVar = createVar()
export const boxShadowVar = createVar()
export const backgroundImageVar = createVar()

export const checkboard = style({
  borderRadius: borderRadiusVar,
  boxShadow: boxShadowVar,
  position: 'absolute',
  inset: 0,
  background: backgroundImageVar,
})
