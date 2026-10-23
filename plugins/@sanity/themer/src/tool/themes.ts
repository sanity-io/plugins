import type {BuildThemeOptions} from '../theme/options'
import {presets} from '../theme/presets'
import type {ImagePalette} from './imagePalette'

/**
 * Where a theme in the themer list comes from: the theme the Studio config
 * was generated from, one of the presets defined in code, or one the user
 * added in the tool. Only custom themes are editable — the others are
 * duplicated into a custom theme first.
 */
type ThemerThemeSource = 'config' | 'preset' | 'custom'

/** A theme the themer tool lists @internal */
export interface ThemerTheme {
  slug: string
  title: string
  options: BuildThemeOptions
  source: ThemerThemeSource
  /** The palette of the image the theme's colors were taken from, for custom themes */
  palette?: ImagePalette
}

/** A theme the user added in the tool, as persisted @internal */
export interface CustomTheme {
  slug: string
  title: string
  options: BuildThemeOptions
  /** The palette of the image the theme's colors were taken from */
  palette?: ImagePalette
}

/** The persisted themer state @internal */
export interface ThemerState {
  /**
   * The slug of the applied theme — `null` applies nothing on top of the
   * Studio's configured theme
   */
  active: string | null
  /** The themes the user added */
  custom: CustomTheme[]
  /** The slugs of the themes the user removed from the list */
  removed: string[]
  /**
   * The slugs of the themes in the order the user arranged them — themes not
   * in it (new presets, themes added since) follow in their default order
   */
  order: string[]
}

/** The slug of the theme the Studio config was generated from @internal */
export const CONFIG_SLUG = 'config'

/** The title of the theme the Studio config was generated from */
export const CONFIG_TITLE = 'Studio config'

/** The title new themes start out with @internal */
export const UNTITLED_THEME = 'Untitled theme'

/** @internal */
export const initialThemerState: ThemerState = {active: null, custom: [], removed: [], order: []}

/** The themes the tool works with, derived from the persisted state @internal */
export interface ResolvedThemes {
  /** The themes to pick from, in list order */
  themes: ThemerTheme[]
  /** The removed themes, which can be restored */
  removed: ThemerTheme[]
  /** The applied theme */
  active: ThemerTheme | undefined
}

const presetsWithSource = presets.map((preset) =>
  Object.assign({}, preset, {source: 'preset' as const}),
)

/**
 * Resolves the list of themes: the presets, then the user's own themes —
 * rearranged into the order the user dragged them into, with themes that
 * order does not know about kept in that default order after the ones it
 * does. Removed themes are set aside so they can be restored. The configured
 * theme is not in the list — `ThemeList` shows it ahead of it — and it is
 * what applies when no listed theme does: `active` is `undefined` for it, and
 * for an applied slug that no longer resolves.
 *
 * @internal
 */
export function resolveThemes(state: ThemerState): ResolvedThemes {
  const all: ThemerTheme[] = [...presetsWithSource]

  for (const theme of state.custom) {
    all.push({
      slug: theme.slug,
      title: theme.title,
      options: theme.options,
      source: 'custom',
      ...(theme.palette ? {palette: theme.palette} : {}),
    })
  }

  const position = new Map(state.order.map((slug, index) => [slug, index]))
  const rank = (theme: ThemerTheme) => position.get(theme.slug) ?? state.order.length

  // A stable sort: the themes the order does not know about keep their default order
  all.sort((a, b) => rank(a) - rank(b))

  const removedSlugs = new Set(state.removed)
  const themes = all.filter((theme) => !removedSlugs.has(theme.slug))
  const removed = all.filter((theme) => removedSlugs.has(theme.slug))
  const active = themes.find((theme) => theme.slug === state.active)

  return {themes, removed, active}
}

/**
 * Creates a custom theme with a slug that cannot collide with the presets or
 * the configured theme.
 *
 * @internal
 */
export function createCustomTheme(
  title: string,
  options: BuildThemeOptions,
  palette?: ImagePalette,
): CustomTheme {
  return {slug: `custom-${randomId()}`, title, options, ...(palette ? {palette} : {})}
}

/** The title of a duplicated theme @internal */
export function duplicateTitle(title: string): string {
  return `${displayTitle(title)} copy`
}

/** The title to show for a theme, falling back when the user cleared it @internal */
export function displayTitle(title: string): string {
  return title.trim() || UNTITLED_THEME
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}
