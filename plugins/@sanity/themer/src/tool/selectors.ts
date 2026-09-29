import type {BuildThemeOptions} from '../theme/options'
import {presets} from '../theme/presets'
import type {ThemerState} from './themes'

export function resolveActiveThemeOptions(state: ThemerState): BuildThemeOptions | undefined {
  const removedSlugs = new Set(state.removed)

  for (const theme of state.custom) {
    if (theme.slug === state.active && !removedSlugs.has(theme.slug)) return theme.options
  }
  for (const preset of presets) {
    if (preset.slug === state.active && !removedSlugs.has(preset.slug)) return preset.options
  }

  return undefined
}
