import {style} from '@vanilla-extract/css'

export const previewFlex = style({
  textAlign: 'center',
  width: '100%',
})

export const actionGrid = style({
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
})
