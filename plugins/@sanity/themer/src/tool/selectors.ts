import type {BuildThemeOptions} from '../theme/options'
import {presets} from '../theme/presets'
import type {ThemerState} from './themes'

/**
 * The options of the applied theme — `null` for the configured theme, which
 * applies nothing on top of the Studio's own, and for an applied theme that
 * no longer resolves. Cheaper than resolving the whole list when only the
 * applied theme matters.
 *
 * @internal
 */
export function resolveActiveThemeOptions(state: ThemerState): BuildThemeOptions | null {
  if (state.active === null || state.removed.includes(state.active)) return null

  for (const theme of state.custom) {
    if (theme.slug === state.active) return theme.options
  }
  for (const preset of presets) {
    if (preset.slug === state.active) return preset.options
  }

  return null
}
