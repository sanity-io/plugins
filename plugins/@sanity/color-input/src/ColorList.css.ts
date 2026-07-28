import {createVar, style} from '@vanilla-extract/css'

export const swatchBackgroundVar = createVar()

export const colorListWrap = style({
  gap: '0.25em',
})

export const colorBoxContainer = style({
  width: '2.1em',
  height: '2.1em',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '3px',
  background:
    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEGHAD97gk2YcNYBhmIQBgWSAP52AwoAQwJvQRg1gACckQoC2gQgAIF8IscwEtKYAAAAASUVORK5CYII=') left center #fff",
})

export const colorBox = style({
  borderRadius: 'inherit',
  boxShadow: 'inset 0 0 0 1px var(--card-shadow-outline-color)',
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  background: swatchBackgroundVar,
})
