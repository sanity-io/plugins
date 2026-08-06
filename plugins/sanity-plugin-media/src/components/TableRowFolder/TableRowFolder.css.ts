import {createVar, style} from '@vanilla-extract/css'

export const hoverBgVar = createVar()

export const containerGrid = style({
  'alignItems': 'center',
  'cursor': 'pointer',
  'height': '100%',
  'userSelect': 'none',
  'whiteSpace': 'nowrap',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          background: hoverBgVar,
        },
      },
    },
  },
})

export const spotYellowVar = createVar()

export const folderBadge = style({
  background: spotYellowVar,
  borderRadius: 6,
  height: 42,
  position: 'relative',
  width: 52,
  selectors: {
    '&::before': {
      background: spotYellowVar,
      borderRadius: '6px 6px 0 0',
      content: '',
      height: 12,
      left: 0,
      position: 'absolute',
      top: -6,
      width: 18,
    },
  },
})
