import {hues} from '@sanity/color'
import {buildTheme, type ThemeColorSchemeKey} from '@sanity/ui/theme'

const {color} = buildTheme().v2!

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
    dark: color.dark.default.input.default.enabled.border,
    light: color.light.default.input.default.enabled.border,
  },
  inputHoveredBorder: {
    dark: color.dark.default.input.default.hovered.border,
    light: color.light.default.input.default.hovered.border,
  },
  mutedHoveredBg: {
    dark: color.dark.primary.button.ghost.primary.hovered.bg,
    light: color.light.primary.button.ghost.primary.hovered.bg,
  },
  mutedHoveredFg: {
    dark: color.dark.primary.button.ghost.primary.hovered.fg,
    light: color.light.primary.button.ghost.primary.hovered.fg,
  },
  mutedSelectedBg: {
    dark: color.dark.primary.button.ghost.primary.selected.bg,
    light: color.light.primary.button.ghost.primary.selected.bg,
  },
  spotBlue: {
    dark: color.dark.default.avatar.blue.bg,
    light: color.light.default.avatar.blue.bg,
  },
}

type SchemeColorKey = keyof typeof SCHEME_COLORS

export function getSchemeColor(scheme: ThemeColorSchemeKey, colorKey: SchemeColorKey): string {
  return SCHEME_COLORS[colorKey]?.[scheme]
}
