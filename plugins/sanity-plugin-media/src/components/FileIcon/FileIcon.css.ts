import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const fontFamilyVar = createVar()

// Force react-file-icon styles
export const container = style({})

globalStyle(`${container} text`, {
  fontFamily: `${fontFamilyVar} !important`,
  fontSize: '8px !important',
  fontWeight: '500 !important',
})
