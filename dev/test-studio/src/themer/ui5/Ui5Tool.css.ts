import {style} from '@vanilla-extract/css'

/**
 * The scroll container — positioned, so that v5's absolutely positioned
 * parts (like the Select chevron, which follows its select by anchor
 * position) are clipped by it rather than float over the header
 */
export const root = style({
  position: 'relative',
  height: '100%',
  overflow: 'auto',
})

export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 1,
})

export const intro = style({
  minWidth: 320,
  maxWidth: 760,
})

export const themeControl = style({
  width: 260,
})

export const mappingControl = style({
  width: 300,
})

export const hueLabel = style({
  width: 64,
})

/** Applies the preview's custom properties without adding a box of its own */
export const scope = style({
  display: 'contents',
})

/** Keeps probes that only serve as a reference out of sight, but rendered and styled */
export const reference = style({
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
})

const swatchBase = style({
  display: 'inline-block',
  flex: 'none',
  width: 17,
  height: 17,
  borderRadius: 3,
  verticalAlign: 'middle',
})

/** A color, painted from the `background-color` set inline */
export const swatch = style([
  swatchBase,
  {
    boxShadow: 'inset 0 0 0 1px rgb(127 127 127 / 0.35)',
  },
])

/** A shadow token, painted as the `box-shadow` set inline */
export const shadowSwatch = style([swatchBase, {margin: 4}])

/** An outline token, painted as the `outline` set inline */
export const outlineSwatch = style([swatchBase, {margin: 4, outlineOffset: 1}])

export const mono = style({
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  fontSize: 11,
  lineHeight: '15px',
  overflowWrap: 'anywhere',
})

/** The component catalog: a name column, then the light and the dark scheme */
export const catalogRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 220px) minmax(0, 1fr) minmax(0, 1fr)',
  gap: 12,
  alignItems: 'stretch',
})

/** The token tables: the token, its source, light and dark, and how it fares */
export const tokenRow = style({
  display: 'grid',
  gridTemplateColumns:
    'minmax(200px, 2fr) minmax(90px, 1fr) minmax(150px, 1.4fr) minmax(150px, 1.4fr) 110px',
  gap: 12,
  alignItems: 'center',
})

/** The specimens the Studio renders with `ui5`: a label, then v4 and v5 */
export const usageRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(96px, 1fr) minmax(0, 1.2fr) minmax(0, 1.2fr)',
  gap: 12,
  alignItems: 'center',
  minHeight: 44,
})

export const strip = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
})
