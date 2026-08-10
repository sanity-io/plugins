import {createVar, style} from '@vanilla-extract/css'

export const bgVar = createVar()
export const borderRadiusVar = createVar()

export const container = style({
  background: bgVar,
  borderRadius: borderRadiusVar,
})
