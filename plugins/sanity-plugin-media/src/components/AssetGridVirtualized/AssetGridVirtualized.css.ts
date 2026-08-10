import {style} from '@vanilla-extract/css'

const CARD_HEIGHT = 220
const CARD_WIDTH = 240

export const itemContainer = style({
  height: CARD_HEIGHT,
  width: CARD_WIDTH,
})

export const listContainer = style({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${CARD_WIDTH}px)`,
  gridTemplateRows: `repeat(auto-fill, ${CARD_HEIGHT}px)`,
  justifyContent: 'center',
  margin: '0 auto',
})
