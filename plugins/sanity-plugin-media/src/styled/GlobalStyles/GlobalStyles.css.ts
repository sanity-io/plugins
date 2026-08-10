import {globalStyle, style} from '@vanilla-extract/css'

// Toggled on `document.body` for as long as the media Browser or Edit Media tool is
// mounted (see index.tsx), scoping the rules below to just that time window — matching
// the old `<GlobalStyle />` (styled-components `createGlobalStyle`) mount/unmount
// lifecycle so they don't leak into the rest of the Studio.
export const globalStylesActive = style({})

function customScrollbar(selector: string) {
  globalStyle(`.${globalStylesActive} ${selector}::-webkit-scrollbar`, {
    width: 14,
  })

  globalStyle(`.${globalStylesActive} ${selector}::-webkit-scrollbar-thumb`, {
    borderRadius: 10,
    border: '4px solid rgba(0, 0, 0, 0)',
    background: 'var(--card-border-color)',
    backgroundClip: 'padding-box',
  })

  globalStyle(`.${globalStylesActive} ${selector}::-webkit-scrollbar-thumb:hover`, {
    background: 'var(--card-muted-fg-color)',
    backgroundClip: 'padding-box',
  })
}

customScrollbar('.media__custom-scrollbar')

// @sanity/ui overrides

// Custom scrollbar on Box (used in Dialogs)
customScrollbar('div[data-ui="Box"]')

// Dialog background color
globalStyle(`.${globalStylesActive} div[data-ui="Dialog"]`, {
  backgroundColor: 'rgba(15, 17, 18, 0.9)',
})
