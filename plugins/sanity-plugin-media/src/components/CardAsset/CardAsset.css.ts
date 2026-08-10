import {createVar, style} from '@vanilla-extract/css'

import {PANEL_HEIGHT} from '../../constants'

export const cardWrapper = style({
  boxSizing: 'border-box',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
})

export const cardContainerBase = style({
  height: '100%',
  position: 'relative',
  transition: 'all 300ms',
  userSelect: 'none',
  width: '100%',
})

export const pickedBorderColorVar = createVar()

export const cardContainerPicked = style({
  border: `1px solid ${pickedBorderColorVar} !important`,
})

export const cardContainerNotPicked = style({
  border: '1px solid inherit',
})

export const cardContainerUpdating = style({
  pointerEvents: 'none',
})

export const cardContainerNotUpdating = style({
  'pointerEvents': 'auto',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          border: '1px solid var(--card-border-color)',
        },
      },
    },
  },
})

export const contextActionHoverBgVar = createVar()

export const contextActionContainer = style({
  'cursor': 'pointer',
  'height': `${PANEL_HEIGHT}px`,
  'transition': 'all 300ms',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {
          background: contextActionHoverBgVar,
        },
      },
    },
  },
})

export const warningOutlineIconColorVar = createVar()

export const warningOutlineIcon = style({
  color: warningOutlineIconColorVar,
})
