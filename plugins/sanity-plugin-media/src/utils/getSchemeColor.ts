import {hues} from '@sanity/color'
import {studioTheme} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'

// oxlint-disable-next-line no-deprecated -- studioTheme is the only static theme accessor
const v2Color = studioTheme.v2!.color

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
    dark: v2Color.dark.default.input.default.enabled.border,
    light: v2Color.light.default.input.default.enabled.border,
  },
  inputHoveredBorder: {
    dark: v2Color.dark.default.input.default.hovered.border,
    light: v2Color.light.default.input.default.hovered.border,
  },
  mutedHoveredBg: {
    dark: v2Color.dark.primary.selectable.primary.hovered.bg,
    light: v2Color.light.primary.selectable.primary.hovered.bg,
  },
  mutedHoveredFg: {
    dark: v2Color.dark.primary.selectable.primary.hovered.fg,
    light: v2Color.light.primary.selectable.primary.hovered.fg,
  },
  mutedSelectedBg: {
    dark: v2Color.dark.primary.selectable.primary.selected.bg,
    light: v2Color.light.primary.selectable.primary.selected.bg,
  },
  spotBlue: {
    dark: v2Color.dark.primary.selectable.primary.selected.bg,
    light: v2Color.light.primary.selectable.primary.selected.bg,
  },
}

type SchemeColorKey = keyof typeof SCHEME_COLORS

export function getSchemeColor(scheme: ThemeColorSchemeKey, colorKey: SchemeColorKey): string {
  return SCHEME_COLORS[colorKey]?.[scheme]
}
