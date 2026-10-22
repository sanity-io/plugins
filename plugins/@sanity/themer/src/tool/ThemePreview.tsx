import {type ThemeColorSchemeKey} from '@sanity/ui/theme'
import {type CSSProperties, useMemo} from 'react'

import type {BuildThemeOptions} from '../theme/options'
import {type PreviewColors, previewColors} from './previewColors'

import styles from './ThemePreview.module.css'

/** The document rows in the list pane — the widths of their title lines */
const LIST_ROWS = ['62%', '46%', '70%', '52%']

/** The fields in the document form — the widths of their labels */
const FIELDS = ['32%', '24%']

/**
 * The colors a mockup paints with — only the ones the theme options change —
 * as the custom properties `ThemePreview.module.css` reads, assigned per
 * color scheme from the `previewColors` of the theme it previews. React's
 * `CSSProperties` does not know custom properties, so the inline `style` is
 * typed through this extension of it.
 */
interface PreviewColorProperties extends CSSProperties {
  '--themer-preview-bg': string
  '--themer-preview-fg': string
  '--themer-preview-muted-fg': string
  '--themer-preview-border': string
  '--themer-preview-accent': string
  '--themer-preview-input-border': string
  '--themer-preview-selected-fg': string
}

function toPreviewColorProperties(colors: PreviewColors): PreviewColorProperties {
  return {
    '--themer-preview-bg': colors.bg,
    '--themer-preview-fg': colors.fg,
    '--themer-preview-muted-fg': colors.mutedFg,
    '--themer-preview-border': colors.border,
    '--themer-preview-accent': colors.accent,
    '--themer-preview-input-border': colors.inputBorder,
    '--themer-preview-selected-fg': colors.selectedFg,
  }
}

/**
 * A tiny, lo-fi mockup of a Studio in the given theme — the navbar over the
 * structure tool with a list of documents on the left and a document form on
 * the right — in both color schemes at once: the light scheme on the left and
 * the dark scheme on the right, split diagonally. It only paints colors the
 * theme options change (backgrounds, text, borders, the accent) so that a
 * glance shows what the theme does to the Studio — with few and bold enough
 * elements to still read when scaled down to a thumbnail.
 *
 * @internal
 */
export function ThemePreview(props: {options: BuildThemeOptions}) {
  const {options} = props
  // Only the handful of colors the mockup paints, rather than a whole Sanity
  // UI theme and a `ThemeProvider` per scheme: theme lists render a preview
  // per theme, and render them in the background before they are shown
  const schemes = useMemo(() => previewColors(options), [options])

  return (
    <div aria-hidden className={styles.root}>
      <MockStudio colors={schemes.light} scheme="light" />
      <MockStudio colors={schemes.dark} scheme="dark" />
    </div>
  )
}

function MockStudio(props: {colors: PreviewColors; scheme: ThemeColorSchemeKey}) {
  const {colors, scheme} = props

  return (
    <div className={styles.studio} data-scheme={scheme} style={toPreviewColorProperties(colors)}>
      <div className={styles.navbar}>
        <div className={styles.logo} />
        <Line color="fg" width="22%" />
        <div className={styles.spacer} />
        <div className={styles.avatar} />
      </div>

      <div className={styles.body}>
        <div className={styles.list}>
          {LIST_ROWS.map((width, index) => {
            const isSelected = index === 1

            return (
              <div key={width} className={styles.listRow} data-selected={isSelected}>
                <Line color={isSelected ? 'selected' : 'muted'} width={width} />
              </div>
            )
          })}
        </div>

        <div className={styles.pane}>
          <div className={styles.form}>
            <Line color="fg" width="45%" />
            {FIELDS.map((width) => (
              <div key={width} className={styles.field}>
                <Line color="muted" width={width} />
                <div className={styles.input} />
              </div>
            ))}
          </div>
          <div className={styles.footer}>
            <div className={styles.button} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** A line of text, in one of the text colors */
function Line(props: {color: 'fg' | 'muted' | 'selected'; width: string}) {
  const {color, width} = props

  return <div className={styles.line} data-color={color} style={{width}} />
}
