import {hues} from '@sanity/color'
import {type ThemeColorSchemeKey, studioTheme} from '@sanity/ui'

// oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
const {color: themeColor} = studioTheme

const SCHEME_COLORS = {
  bg: {
    dark: hues.gray[950].hex,
    light: hues.gray[50].hex,
  },
  bg2: {
    dark: hues.gray[900].hex,
    light: hues.gray[100].hex,
  },
  inputEnabledBorder: {
    dark: themeColor.dark.default.input.default.enabled.border,
    light: themeColor.light.default.input.default.enabled.border,
  },
  inputHoveredBorder: {
    dark: themeColor.dark.default.input.default.hovered.border,
    light: themeColor.light.default.input.default.hovered.border,
  },
  mutedHoveredBg: {
    dark: themeColor.dark.primary.muted.primary.hovered.bg,
    light: themeColor.light.primary.muted.primary.hovered.bg,
  },
  mutedHoveredFg: {
    dark: themeColor.dark.primary.muted.primary.hovered.fg,
    light: themeColor.light.primary.muted.primary.hovered.fg,
  },
  mutedSelectedBg: {
    dark: themeColor.dark.primary.muted.primary.selected.bg,
    light: themeColor.light.primary.muted.primary.selected.bg,
  },
  spotBlue: {
    dark: themeColor.dark.primary.spot.blue,
    light: themeColor.light.primary.spot.blue,
  },
}

type SchemeColorKey = keyof typeof SCHEME_COLORS

// oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
export function getSchemeColor(scheme: ThemeColorSchemeKey, colorKey: SchemeColorKey): string {
  return SCHEME_COLORS[colorKey]?.[scheme]
}
