import {createVar, style} from '@vanilla-extract/css'

export const widthVar = createVar()
export const previewBackgroundVar = createVar()

export const root = style({
  width: widthVar,
})

export const saturationCard = style({
  position: 'relative',
  height: '5em',
})

export const sliderCard = style({
  position: 'relative',
  height: '10px',
})

export const alphaCard = style({
  position: 'relative',
  height: '10px',
  background: '#fff',
})

export const previewCard = style({
  position: 'relative',
  minWidth: '4em',
  background: '#fff',
})

export const colorBox = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: previewBackgroundVar,
})

export const readOnlyContainer = style({
  marginTop: '6rem',
  backgroundColor: 'var(--card-bg-color)',
  position: 'relative',
  width: '100%',
})

export const fieldsBox = style({
  width: 200,
})
