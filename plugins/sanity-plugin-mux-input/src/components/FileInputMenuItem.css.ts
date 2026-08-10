import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const boxShadowFocusVar = createVar()

export const fileButton = style({
  position: 'relative',
  selectors: {
    '&:not([data-disabled="true"]):focus-within': {
      boxShadow: boxShadowFocusVar,
    },
  },
})

globalStyle(`${fileButton} input`, {
  overflow: 'hidden',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  position: 'absolute',
  minWidth: 0,
  display: 'block',
  appearance: 'none',
  padding: 0,
  margin: 0,
  border: 0,
  opacity: 0,
})
