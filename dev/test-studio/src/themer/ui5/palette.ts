import {buildPalette, type BuildThemeOptions, type GeneratedColorPalette} from '@sanity/themer'
import type {CSSProperties} from 'react'

import {type CustomPropertyName, getUi5Stylesheet} from './stylesheet'

/**
 * How the screen applies a Themer palette to v5 — the prototype of what
 * Themer would have to do to theme it:
 *
 * - `off`: nothing, the way the Studio renders v5 today
 * - `scales`: the palette replaces v5's scales (`--blue-*`, `--gray-*`,
 *   `--white`, `--black`, …) on the preview
 * - `tokens`: the scales, and the `:root` tokens that read them declared
 *   again on the preview, so that they resolve against the replaced scales
 */
export type Ui5Mapping = 'off' | 'scales' | 'tokens'

export type CustomProperties = ReadonlyMap<CustomPropertyName, string>

function scaleColors(palette: GeneratedColorPalette): Map<CustomPropertyName, string> {
  const colors = new Map<CustomPropertyName, string>()

  for (const [hue, value] of Object.entries(palette)) {
    if (typeof value === 'string') {
      colors.set(`--${hue}`, value)
    } else {
      for (const [tint, color] of Object.entries(value)) colors.set(`--${hue}-${tint}`, color)
    }
  }

  return colors
}

/**
 * The scales of the palettes Themer generates for the options, as v5 scale
 * tokens. Themer generates a palette per color scheme where v5 has one set
 * of scales for both, so a tint that differs between the schemes becomes a
 * `light-dark()` of the two — which v5's own `light-dark()`s pick from.
 */
export function scaleProperties(options: BuildThemeOptions): CustomProperties {
  const palettes = buildPalette(options)
  const dark = scaleColors(palettes.dark)
  const properties = new Map<CustomPropertyName, string>()

  for (const [name, lightColor] of scaleColors(palettes.light)) {
    const darkColor = dark.get(name) ?? lightColor
    properties.set(
      name,
      lightColor === darkColor ? lightColor : `light-dark(${lightColor}, ${darkColor})`,
    )
  }

  return properties
}

/**
 * The `:root` tokens that read a scale, as declared. A custom property
 * resolves its `var()`s on the element that declares it, so these resolve
 * once, on `:root`, and keep the stock scales however the scales are
 * replaced further down — unless they are declared again where the scales
 * are replaced.
 */
export function rootTokensReadingScales(): CustomProperties {
  return new Map(
    getUi5Stylesheet()
      .semantic.filter((token) => token.sources.some((source) => source !== 'fixed'))
      .map((token) => [token.name, token.value]),
  )
}

/** The custom properties that apply the options to v5 with the mapping */
export function ui5Properties(options: BuildThemeOptions, mapping: Ui5Mapping): CustomProperties {
  if (mapping === 'off') return new Map()
  if (mapping === 'scales') return scaleProperties(options)

  return new Map([...scaleProperties(options), ...rootTokensReadingScales()])
}

/**
 * Every custom property v5 declares on `:root`, as declared: applied to an
 * element, they put v5 back to stock inside it, whatever the document sets
 */
export function stockProperties(): CustomProperties {
  return getUi5Stylesheet().root
}

/** Custom properties as a `style` — `CSSProperties` has no type for them */
export function toStyle(properties: CustomProperties): CSSProperties | undefined {
  if (properties.size === 0) return undefined

  const style: CSSProperties & Partial<Record<CustomPropertyName, string>> = {}
  for (const [name, value] of properties) style[name] = value

  return style
}
