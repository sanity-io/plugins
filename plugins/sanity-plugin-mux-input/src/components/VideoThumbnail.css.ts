import {style} from '@vanilla-extract/css'

export const thumbnailImage = style({
  transition: 'opacity 0.175s ease-out 0s',
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center center',
})
