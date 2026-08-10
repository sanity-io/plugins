import {globalStyle, style} from '@vanilla-extract/css'

export const cardWrapper = style({
  minHeight: 82,
  boxSizing: 'border-box',
})

export const flexWrapper = style({
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

export const leftSection = style({
  position: 'relative',
  width: '60%',
})

export const codeWrapper = style({
  position: 'relative',
  width: '100%',
})

globalStyle(`${codeWrapper} code`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  position: 'relative',
  maxWidth: 200,
})
