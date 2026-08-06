import {createVar, style} from '@vanilla-extract/css'

export const containerGridBase = style({
  alignItems: 'center',
  height: '100%',
  userSelect: 'none',
  whiteSpace: 'nowrap',
})

export const containerGridSelected = style({cursor: 'default'})
export const containerGridNotSelected = style({cursor: 'pointer'})

export const hoverBgVar = createVar()

export const containerGridUpdating = style({pointerEvents: 'none'})
export const containerGridNotUpdating = style({
  'pointerEvents': 'auto',
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

export const contextActionHoverBgVar = createVar()

export const contextActionContainer = style({
  'cursor': 'pointer',
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

export const warningIconColorVar = createVar()

export const warningIcon = style({
  color: warningIconColorVar,
})
