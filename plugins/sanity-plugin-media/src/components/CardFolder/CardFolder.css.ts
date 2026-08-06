import {createVar, style} from '@vanilla-extract/css'

export const cardWrapper = style({
  boxSizing: 'border-box',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
})

export const folderCard = style({
  'cursor': 'pointer',
  'height': '100%',
  'transition': 'border-color 200ms ease',
  'width': '100%',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          borderColor: 'var(--card-border-color)',
        },
      },
    },
  },
})

export const spotYellowVar = createVar()

export const folderGlyph = style({
  alignItems: 'flex-end',
  background: `linear-gradient(180deg, ${spotYellowVar} 0%, ${spotYellowVar} 100%)`,
  borderRadius: 8,
  display: 'flex',
  height: 72,
  position: 'relative',
  width: 96,
  selectors: {
    '&::before': {
      background: spotYellowVar,
      borderRadius: '8px 8px 0 0',
      content: '',
      height: 18,
      left: 0,
      position: 'absolute',
      top: -8,
      width: 38,
    },
  },
})
