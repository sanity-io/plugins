import {style, styleVariants} from '@vanilla-extract/css'

export const videoPreview = styleVariants({
  default: {
    maxWidth: '80px',
  },
  block: {
    maxWidth: '100%',
  },
})

export const rawFileLabel = style({
  marginLeft: '0.5em',
})

export const thumbnailFlex = style({
  width: '100%',
})

export const thumbnailImage = style({
  maxWidth: '80px',
  height: 'auto',
  display: 'block',
})

export const fullWidthPreview = style({
  width: '100%',
})

export const fullWidthImage = style({
  width: '100%',
  height: 'auto',
  display: 'block',
})
