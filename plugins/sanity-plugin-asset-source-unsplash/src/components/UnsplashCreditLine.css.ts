import {createVar, globalStyle, style, type StyleRule} from '@vanilla-extract/css'

export const creditLineFgVar = createVar()
export const creditLineBgVar = createVar()

export const creditLineLink = style({
  textDecoration: 'none',
  cursor: 'pointer',
})

globalStyle(`${creditLineLink}:hover [data-ui="Text"]`, {
  textDecoration: 'underline',
})

globalStyle(`${creditLineLink}:focus [data-ui="Text"]`, {
  textDecoration: 'underline',
})

export const creditLine = style({
  // -webkit-user-drag is a non-standard vendor property not covered by csstype.
  WebkitUserDrag: 'none',
  position: 'absolute',
  backgroundColor: creditLineBgVar,
  bottom: 0,
} as StyleRule)

globalStyle(`${creditLine} [data-ui="Text"]`, {
  color: creditLineFgVar,
})
