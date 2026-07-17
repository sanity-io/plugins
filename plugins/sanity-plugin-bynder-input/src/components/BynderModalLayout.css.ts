import {globalStyle} from '@vanilla-extract/css'

/**
 * `@bynder/compact-view`'s `Modal` portals into a plain `div` it appends to `document.body`,
 * without giving it any overlay styles or a z-index of its own — in Sanity Studio the modal ends
 * up stacking below the Studio UI. Style the host from here instead of patching the package.
 * `BynderInput` only mounts the modal while it is open, so the host (and this overlay) is removed
 * from the DOM on close and never blocks interaction with the Studio.
 */
globalStyle('[data-test-id=CompactViewContainer]', {
  position: 'fixed',
  inset: 0,
  zIndex: 999999,
  pointerEvents: 'auto',
})
