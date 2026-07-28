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
  selectors: {
    // Doubled class doubles specificity so the white checkerboard base wins
    // over Card's own `background-color` (same 0-1-0 specificity, but the
    // styled-components rule is injected later and would win the tie).
    '&&': {
      background: '#fff',
    },
  },
})

export const previewCard = style({
  position: 'relative',
  minWidth: '4em',
  selectors: {
    '&&': {
      background: '#fff',
    },
  },
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
