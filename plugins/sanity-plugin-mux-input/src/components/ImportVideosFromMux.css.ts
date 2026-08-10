import {globalStyle, style} from '@vanilla-extract/css'

export const missingAssetCheckbox = style({
  selectors: {
    '&&': {
      position: 'static',
    },
  },
})

globalStyle(`${missingAssetCheckbox} input::after`, {
  content: '',
  position: 'absolute',
  inset: 0,
  display: 'block',
  cursor: 'pointer',
  zIndex: 1000,
})
