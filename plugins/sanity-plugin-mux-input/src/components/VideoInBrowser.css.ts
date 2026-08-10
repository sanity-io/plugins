import {globalStyle, style} from '@vanilla-extract/css'

export const playButton = style({
  display: 'block',
  padding: 0,
  margin: 0,
  border: 'none',
  borderRadius: '0.1875rem',
  position: 'relative',
  cursor: 'pointer',
  selectors: {
    '&::after': {
      content: '',
      background: 'var(--card-fg-color)',
      opacity: 0,
      display: 'block',
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      transition: '0.15s ease-out',
      borderRadius: 'inherit',
    },
    '&:hover::after': {
      opacity: 0.3,
    },
    '&:focus::after': {
      opacity: 0.3,
    },
  },
})

globalStyle(`${playButton} > div[data-play]`, {
  zIndex: 11,
  opacity: 0,
  transition: '0.15s 0.05s ease-out',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'var(--card-fg-color)',
  background: 'var(--card-bg-color)',
  width: 'auto',
  height: '30%',
  aspectRatio: '1',
  borderRadius: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxSizing: 'border-box',
})

// Visual balance to center-align the icon
globalStyle(`${playButton} > div[data-play] > svg`, {
  display: 'block',
  width: '70%',
  height: 'auto',
  transform: 'translateX(5%)',
})

globalStyle(`${playButton}:hover > div[data-play]`, {
  opacity: 1,
})

globalStyle(`${playButton}:focus > div[data-play]`, {
  opacity: 1,
})
