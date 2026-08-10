import {style} from '@vanilla-extract/css'

export const setupButtonContainer = style({
  position: 'relative',
  display: 'block',
  fontSize: '0.8em',
  transform: 'translate(0%, -10%)',
})

export const previewFlex = style({
  textAlign: 'center',
  width: '100%',
})

export const actionGrid = style({
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
})
