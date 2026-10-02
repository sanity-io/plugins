import type {BuildThemeOptions} from '../theme/options'
import {presets} from '../theme/presets'
import type {ThemerSnapshot} from './machine'
import type {ThemerState} from './themes'

/**
 * The flow the sidebar is in: picking a theme from the list, editing one of
 * the user's own themes, or restoring removed ones.
 *
 * @internal
 */
export type ThemerView =
  | {name: 'list'}
  | {
      name: 'edit'
      slug: string
      /** Whether the title input should take focus, for themes that were just created */
      focusTitle: boolean
    }
  | {name: 'removed'}

/** The flow the sidebar is in, from the machine's snapshot @internal */
export function selectView(snapshot: ThemerSnapshot): ThemerView {
  const {editing} = snapshot.context

  if (snapshot.matches({flow: 'edit'}) && editing) {
    return {name: 'edit', slug: editing.slug, focusTitle: editing.focusTitle}
  }

  if (snapshot.matches({flow: 'removed'})) {
    return {name: 'removed'}
  }

  return {name: 'list'}
}

/** @internal */
export function sameView(a: ThemerView, b: ThemerView): boolean {
  if (a.name !== b.name) return false

  return (
    a.name !== 'edit' || b.name !== 'edit' || (a.slug === b.slug && a.focusTitle === b.focusTitle)
  )
}

/** @internal */
export function sameStoredState(a: ThemerState, b: ThemerState): boolean {
  return (
    a.active === b.active && a.custom === b.custom && a.removed === b.removed && a.order === b.order
  )
}

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
