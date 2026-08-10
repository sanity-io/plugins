import {globalStyle, style} from '@vanilla-extract/css'

/** To prevent Content Layout Shift (CLS), ensure that the dialog always occupies the entire available height. */
export const fullHeightDialog = style({})

globalStyle(`${fullHeightDialog} > div[data-ui='DialogCard'] > div[data-ui='Card']`, {
  height: '100%',
})
