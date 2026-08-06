import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const marginBottomVar = createVar()

export const stackContainer = style({})

globalStyle(`${stackContainer} > *`, {
  marginBottom: marginBottomVar,
})
