import {createVar, style} from '@vanilla-extract/css'

export const errorIconColorVar = createVar()

export const errorOutlineIcon = style({
  color: errorIconColorVar,
})
