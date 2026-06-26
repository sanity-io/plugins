import {style} from '@vanilla-extract/css'

export const mapDiffImage = style({
  display: 'block',
  width: '100%',
  height: 'auto',
  objectFit: 'contain',
  verticalAlign: 'top',
})

export const mapDiffPlaceholder = style({
  width: '100%',
  minHeight: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})
