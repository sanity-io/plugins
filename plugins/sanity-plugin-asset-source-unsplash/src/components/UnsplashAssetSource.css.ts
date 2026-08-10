import {globalStyle, style} from '@vanilla-extract/css'

export const unsplashDialog = style({})

// The Dialog's own `height="100%"` prop does not cascade to its internal
// DialogCard/Card wrapper, so it must be forced here.
globalStyle(`${unsplashDialog} > [data-ui="DialogCard"] > [data-ui="Card"]`, {
  height: '100%',
})
