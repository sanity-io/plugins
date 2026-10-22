import {type ThemeColorSchemeKey} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import type {BuildThemeOptions} from '../theme/options'
import {type PreviewColors, previewColors} from './previewColors'

import {
  avatar,
  body,
  button,
  colors,
  field,
  footer,
  form,
  input,
  line,
  list,
  listRow,
  logo,
  navbar,
  pane,
  root,
  spacer,
  studio,
} from './ThemePreview.css'

/** The document rows in the list pane — the widths of their title lines */
const LIST_ROWS = ['62%', '46%', '70%', '52%']

/** The fields in the document form — the widths of their labels */
const FIELDS = ['32%', '24%']

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
    <div aria-hidden className={root}>
      <MockStudio colors={schemes.light} scheme="light" />
      <MockStudio colors={schemes.dark} scheme="dark" />
    </div>
  )
}

function MockStudio(props: {colors: PreviewColors; scheme: ThemeColorSchemeKey}) {
  const {scheme} = props

  return (
    <div className={studio[scheme]} style={assignInlineVars(colors, props.colors)}>
      <div className={navbar}>
        <div className={logo} />
        <div className={line.fg} style={{width: '22%'}} />
        <div className={spacer} />
        <div className={avatar} />
      </div>

      <div className={body}>
        <div className={list}>
          {LIST_ROWS.map((width, index) => {
            const isSelected = index === 1

            return (
              <div key={width} className={listRow} data-selected={isSelected}>
                <div className={isSelected ? line.selected : line.muted} style={{width}} />
              </div>
            )
          })}
        </div>

        <div className={pane}>
          <div className={form}>
            <div className={line.fg} style={{width: '45%'}} />
            {FIELDS.map((width) => (
              <div key={width} className={field}>
                <div className={line.muted} style={{width}} />
                <div className={input} />
              </div>
            ))}
          </div>
          <div className={footer}>
            <div className={button} />
          </div>
        </div>
      </div>
    </div>
  )
}
