import {createVar, style} from '@vanilla-extract/css'

export const checkerboardColorVar = createVar()

export const image = style({
  vars: {
    [checkerboardColorVar]: 'inherit',
  },
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const imageCheckerboard = style([
  image,
  {
    backgroundImage: [
      `linear-gradient(45deg, ${checkerboardColorVar} 25%, transparent 25%)`,
      `linear-gradient(-45deg, ${checkerboardColorVar} 25%, transparent 25%)`,
      `linear-gradient(45deg, transparent 75%, ${checkerboardColorVar} 75%)`,
      `linear-gradient(-45deg, transparent 75%, ${checkerboardColorVar} 75%)`,
    ].join(', '),
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
  },
])
