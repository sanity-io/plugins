import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const fgVar = createVar()

export const container = style({})

globalStyle(`${container} *`, {
  color: fgVar,
})

globalStyle(`${container} a`, {
  textDecoration: 'none',
})
