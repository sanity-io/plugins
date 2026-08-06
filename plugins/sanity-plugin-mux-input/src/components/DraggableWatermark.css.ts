import {globalStyle, style} from '@vanilla-extract/css'

export const rangeInput = style({
  width: '100%',
  height: 4,
  borderRadius: 2,
  background: 'var(--card-border-color)',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  selectors: {
    '&::-webkit-slider-thumb': {
      WebkitAppearance: 'none',
      appearance: 'none',
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--card-focus-ring-color, #2276fc)',
      cursor: 'pointer',
      border: '2px solid white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    },
    '&::-moz-range-thumb': {
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--card-focus-ring-color, #2276fc)',
      cursor: 'pointer',
      border: '2px solid white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    },
    '&:hover::-webkit-slider-thumb': {
      background: 'var(--card-focus-ring-color, #1a5fc7)',
    },
    '&:hover::-moz-range-thumb': {
      background: 'var(--card-focus-ring-color, #1a5fc7)',
    },
  },
})

export const watermarkOverlay = style({
  position: 'absolute',
  maxWidth: 200,
  cursor: 'move',
  userSelect: 'none',
  zIndex: 10,
  pointerEvents: 'auto',
  selectors: {
    '&:hover': {
      outline: '2px dashed rgba(255, 255, 255, 0.8)',
      outlineOffset: 4,
    },
  },
})

globalStyle(`${watermarkOverlay} img`, {
  width: '100%',
  height: 'auto',
  display: 'block',
  pointerEvents: 'none',
})
