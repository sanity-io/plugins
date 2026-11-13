import {multiply, parseColor, rgbToHex, screen, type ThemeColorSchemeKey} from '@sanity/ui/theme'

import {buildBasePalettes, type GeneratedBasePalette} from '../theme/buildPalette'
import type {BuildThemeOptions} from '../theme/options'

/**
 * The colors the theme preview paints one color scheme with — the few
 * distinct colors of the default card that the theme options change.
 *
 * @internal
 */
export interface PreviewColors {
  /** The card background, which the input background shares */
  bg: string
  fg: string
  mutedFg: string
  border: string
  /** Primary buttons, which the avatar and the selected list row share */
  accent: string
  inputBorder: string
  /** The text of the selected list row */
  selectedFg: string
}

/**
 * The preview colors of both schemes, straight from the generated palette
 * instead of a whole Sanity UI theme: they are the colors that
 * `buildTheme(options)` gives the default card, its primary button, its
 * selected list item and its text input.
 *
 * @internal
 */
export function previewColors(
  options: BuildThemeOptions,
): Record<ThemeColorSchemeKey, PreviewColors> {
  const palettes = buildBasePalettes(options)

  return {
    light: lightPreviewColors(palettes.light),
    dark: darkPreviewColors(palettes.dark),
  }
}

// The light scheme multiplies its colors onto its white background, which
// leaves them as they are — unless they fall outside the palette's range
function lightPreviewColors(palette: GeneratedBasePalette): PreviewColors {
  const {white, gray, blue} = palette
  const ink = (hex: string) => blendOnto(hex, white, 'multiply', palette)

  return {
    bg: white,
    fg: ink(gray['800']),
    mutedFg: ink(gray['600']),
    border: ink(gray['200']),
    accent: ink(blue['500']),
    inputBorder: ink(gray['200']),
    selectedFg: white,
  }
}

// The dark scheme screens its colors onto a background a shade lighter than
// black, which lifts them
function darkPreviewColors(palette: GeneratedBasePalette): PreviewColors {
  const {black, gray, blue} = palette
  const bg = blendOnto(gray['950'], black, 'screen', palette)
  const ink = (hex: string) => blendOnto(hex, bg, 'screen', palette)

  return {
    bg,
    fg: ink(gray['200']),
    mutedFg: ink(gray['400']),
    border: ink(gray['800']),
    accent: ink(blue['400']),
    inputBorder: ink(gray['700']),
    selectedFg: black,
  }
}

/**
 * Blends a color onto a background the way Sanity UI blends theme colors:
 * within the palette's range from `black` to `white` rather than the full
 * RGB range, so the result never leaves the palette's darkest and lightest
 * colors.
 */
function blendOnto(
  hex: string,
  bg: string,
  mode: 'multiply' | 'screen',
  {black, white}: GeneratedBasePalette,
): string {
  const low = parseColor(black)
  const high = parseColor(white)

  const toFullRange = (value: string) => {
    const {r, g, b} = parseColor(value)

    return {
      r: stretch(r, low.r, high.r),
      g: stretch(g, low.g, high.g),
      b: stretch(b, low.b, high.b),
    }
  }

  const blended = (mode === 'multiply' ? multiply : screen)(toFullRange(bg), toFullRange(hex))

  return rgbToHex({
    r: squeeze(blended.r, low.r, high.r),
    g: squeeze(blended.g, low.g, high.g),
    b: squeeze(blended.b, low.b, high.b),
  })
}

/** Maps a channel from the palette's range onto the full 0–255 range */
function stretch(value: number, low: number, high: number): number {
  return clamp(((value - low) * 255) / (high - low), 0, 255)
}

/** Maps a channel from the full 0–255 range back into the palette's range */
function squeeze(value: number, low: number, high: number): number {
  return clamp(low + (value * (high - low)) / 255, low, high)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
