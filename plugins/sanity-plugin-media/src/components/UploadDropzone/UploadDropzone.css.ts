import {style} from '@vanilla-extract/css'

export const uploadContainer = style({
  color: 'white',
  height: '100%',
  minHeight: '100%',
  right: 0,
  top: 0,
  width: '100%',
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
})

export const dragActiveContainer = style({
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  position: 'absolute',
  right: 0,
  top: 0,
  width: '100%',
  zIndex: 3,
})
