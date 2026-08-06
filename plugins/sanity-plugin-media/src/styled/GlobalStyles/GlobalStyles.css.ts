import {globalStyle} from '@vanilla-extract/css'

function customScrollbar(selector: string) {
  globalStyle(`${selector}::-webkit-scrollbar`, {
    width: 14,
  })

  globalStyle(`${selector}::-webkit-scrollbar-thumb`, {
    borderRadius: 10,
    border: '4px solid rgba(0, 0, 0, 0)',
    background: 'var(--card-border-color)',
    backgroundClip: 'padding-box',
  })

  globalStyle(`${selector}::-webkit-scrollbar-thumb:hover`, {
    background: 'var(--card-muted-fg-color)',
    backgroundClip: 'padding-box',
  })
}

customScrollbar('.media__custom-scrollbar')

// @sanity/ui overrides

// Custom scrollbar on Box (used in Dialogs)
customScrollbar('div[data-ui="Box"]')

// Dialog background color
globalStyle('div[data-ui="Dialog"]', {
  backgroundColor: 'rgba(15, 17, 18, 0.9)',
})
