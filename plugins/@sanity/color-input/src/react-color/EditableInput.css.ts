import {createVar, style} from '@vanilla-extract/css'

export const inputBorderVar = createVar()
export const inputFgVar = createVar()
export const inputBgVar = createVar()
export const inputFontSizeVar = createVar()
export const labelFontSizeVar = createVar()
export const labelFgVar = createVar()

export const wrap = style({
  position: 'relative',
})

export const input = style({
  width: '80%',
  padding: '4px 10% 3px',
  border: 'none',
  boxShadow: `inset 0 0 0 1px ${inputBorderVar}`,
  color: inputFgVar,
  backgroundColor: inputBgVar,
  fontSize: inputFontSizeVar,
  textAlign: 'center',
})

export const label = style({
  display: 'block',
  textAlign: 'center',
  fontSize: labelFontSizeVar,
  color: labelFgVar,
  paddingTop: '3px',
  paddingBottom: '4px',
  textTransform: 'capitalize',
})

export const labelDrag = style({
  cursor: 'ew-resize',
})
