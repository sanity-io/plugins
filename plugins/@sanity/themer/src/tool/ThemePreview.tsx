import {ThemeProvider, useTheme_v2} from '@sanity/ui'
import {type ThemeColorSchemeKey} from '@sanity/ui/theme'
import {type CSSProperties, useMemo} from 'react'

import {buildTheme} from '../theme/buildTheme'
import type {BuildThemeOptions} from '../theme/options'

import styles from './ThemePreview.module.css'

/** The document rows in the list pane — the widths of their title lines */
const LIST_ROWS = ['62%', '46%', '70%', '52%']

/** The fields in the document form — the widths of their labels */
const FIELDS = ['32%', '24%']

/**
 * The colors a mockup paints with — only the ones the theme options change —
 * as the custom properties `ThemePreview.module.css` reads, assigned per
 * color scheme from the theme it previews. React's `CSSProperties` does not
 * know custom properties, so the inline `style` is typed through this
 * extension of it.
 */
interface PreviewColors extends CSSProperties {
  '--themer-preview-bg': string
  '--themer-preview-fg': string
  '--themer-preview-muted-fg': string
  '--themer-preview-border': string
  '--themer-preview-accent': string
  '--themer-preview-avatar': string
  '--themer-preview-selected-bg': string
  '--themer-preview-selected-fg': string
  '--themer-preview-input-bg': string
  '--themer-preview-input-border': string
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
  const theme = useMemo(() => buildTheme(options), [options])

  return (
    <div aria-hidden className={styles.root}>
      <ThemeProvider scheme="light" theme={theme} tone="default">
        <MockStudio scheme="light" />
      </ThemeProvider>
      <ThemeProvider scheme="dark" theme={theme} tone="default">
        <MockStudio scheme="dark" />
      </ThemeProvider>
    </div>
  )
}

function MockStudio(props: {scheme: ThemeColorSchemeKey}) {
  const {scheme} = props
  const {color} = useTheme_v2()
  const selected = color.selectable.default.selected
  const inputColor = color.input.default.enabled
  const colors: PreviewColors = {
    '--themer-preview-bg': color.bg,
    '--themer-preview-fg': color.fg,
    '--themer-preview-muted-fg': color.muted.fg,
    '--themer-preview-border': color.border,
    '--themer-preview-accent': color.button.default.primary.enabled.bg,
    '--themer-preview-avatar': color.avatar.blue.bg,
    '--themer-preview-selected-bg': selected.bg,
    '--themer-preview-selected-fg': selected.fg,
    '--themer-preview-input-bg': inputColor.bg,
    '--themer-preview-input-border': inputColor.border,
  }

  return (
    <div className={styles.studio} data-scheme={scheme} style={colors}>
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
