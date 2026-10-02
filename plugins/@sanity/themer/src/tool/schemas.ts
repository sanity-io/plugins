import * as v from 'valibot'

import {isColor} from '../lib/mix'
import {
  type BuildThemeOptions,
  MAXIMUM_CONTRAST,
  MINIMUM_CONTRAST,
  SCHEMES,
  type SchemeThemeOptions,
} from '../theme/options'
import {presets} from '../theme/presets'
import type {ImagePalette} from './imagePalette'
import type {ThemerMachineContext} from './machine'
import {CONFIG_SLUG, type CustomTheme, displayTitle, type ThemerState} from './themes'

/*
 * What the tool keeps in `localStorage` is parsed with these schemas as it is
 * read back, so that a session starts from what it can use of what an
 * earlier one left — whatever version of the tool wrote it, and whatever
 * happened to it since. The schemas are lenient where the old sanitizers
 * were: a color that is not one is dropped rather than failing the theme it
 * is part of, a theme that cannot be used is dropped rather than failing the
 * list, and the shapes of earlier versions are converted into today's.
 */

/** Drops the keys whose value is `undefined`, which a dropped option leaves behind */
function compact<T extends object>(value: T): T {
  // oxlint-disable-next-line no-unsafe-type-assertion -- the same keys, minus the undefined ones
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T
}

/** A `#rgb` or `#rrggbb` color, lowercased */
const color = v.pipe(v.string(), v.check(isColor), v.toLowerCase())

/** A color that is dropped rather than failing what it is part of */
const optionalColor = v.fallback(v.optional(color), undefined)

/** A contrast, clamped into range — dropped when it is not a number */
const optionalContrast = v.fallback(
  v.optional(
    v.pipe(v.number(), v.finite(), v.toMinValue(MINIMUM_CONTRAST), v.toMaxValue(MAXIMUM_CONTRAST)),
  ),
  undefined,
)

const schemeOptionsSchema = v.pipe(
  v.object({
    accent: optionalColor,
    text: optionalColor,
    background: optionalColor,
    contrast: optionalContrast,
  }),
  v.transform((options): SchemeThemeOptions => compact(options)),
)

/** Options grouped by scheme, as they are today — a scheme without usable options is left out */
const groupedOptionsSchema = v.pipe(
  v.looseObject({
    light: v.fallback(v.optional(schemeOptionsSchema), undefined),
    dark: v.fallback(v.optional(schemeOptionsSchema), undefined),
  }),
  // The flat shape of earlier versions always had an accent at the top
  v.check((input) => !('accent' in input), 'flat options'),
  v.transform(({light, dark}): BuildThemeOptions => {
    const options: BuildThemeOptions = {}

    if (light && Object.keys(light).length > 0) options.light = light
    if (dark && Object.keys(dark).length > 0) options.dark = dark

    return options
  }),
)

/**
 * Options from before they were grouped by scheme: one accent, text color and
 * contrast for both schemes, and a background per scheme. Both schemes get
 * the shared colors, so the theme keeps looking the same.
 */
const flatOptionsSchema = v.pipe(
  v.object({
    accent: color,
    text: optionalColor,
    contrast: optionalContrast,
    background: v.fallback(
      v.optional(v.object({light: optionalColor, dark: optionalColor})),
      undefined,
    ),
  }),
  v.transform(({accent, text, contrast, background}): BuildThemeOptions => {
    const shared: SchemeThemeOptions = compact({accent, text, contrast})
    const options: BuildThemeOptions = {}

    for (const scheme of SCHEMES) {
      const schemeBackground = background?.[scheme]

      options[scheme] = schemeBackground ? {...shared, background: schemeBackground} : {...shared}
    }

    return options
  }),
)

/** The `buildTheme` options of a theme, in today's shape or an earlier version's @internal */
export const themeOptionsSchema = v.union([flatOptionsSchema, groupedOptionsSchema])

/** A swatch of an image palette — `null` when it is missing or not a color */
const swatch = v.fallback(v.optional(v.nullable(color), null), null)

/** The palette a theme took its colors from — `null` without a single swatch */
const paletteSchema = v.pipe(
  v.object({
    vibrant: swatch,
    lightVibrant: swatch,
    darkVibrant: swatch,
    muted: swatch,
    lightMuted: swatch,
    darkMuted: swatch,
    dominant: swatch,
  }),
  v.transform((palette): ImagePalette | null =>
    Object.values(palette).some((item) => item !== null) ? palette : null,
  ),
)

function isReservedSlug(slug: string): boolean {
  return slug === CONFIG_SLUG || presets.some((preset) => preset.slug === slug)
}

const customThemeSchema = v.pipe(
  v.object({
    slug: v.pipe(
      v.string(),
      v.nonEmpty(),
      v.check((slug) => !isReservedSlug(slug), 'reserved slug'),
    ),
    title: v.fallback(v.optional(v.string()), undefined),
    options: themeOptionsSchema,
    palette: v.fallback(v.optional(paletteSchema), undefined),
  }),
  v.transform(({slug, title, options, palette}): CustomTheme => ({
    slug,
    title: displayTitle(title ?? ''),
    options,
    ...(palette ? {palette} : {}),
  })),
)

/** The items of a list that can be used, each parsed on its own so that one bad item does not fail the rest */
const lenientList = v.fallback(v.optional(v.array(v.unknown()), []), [])

/**
 * The persisted themer state — the applied theme, the user's themes and
 * what was removed and reordered — as it is read back. Custom themes that
 * cannot be used, repeated slugs, and removed or ordered slugs that name no
 * theme are dropped.
 */
const themerStateSchema = v.pipe(
  v.object({
    active: v.fallback(v.nullable(v.string()), null),
    custom: lenientList,
    removed: lenientList,
    order: lenientList,
  }),
  v.transform((state): ThemerState => {
    const custom: CustomTheme[] = []

    for (const item of state.custom) {
      const result = v.safeParse(customThemeSchema, item)

      if (result.success && !custom.some((theme) => theme.slug === result.output.slug)) {
        custom.push(result.output)
      }
    }

    const isCustom = (slug: string) => custom.some((theme) => theme.slug === slug)
    const isPreset = (slug: string) => presets.some((preset) => preset.slug === slug)
    const removed: string[] = []
    const order: string[] = []

    for (const slug of state.removed) {
      if (typeof slug !== 'string' || slug === CONFIG_SLUG || removed.includes(slug)) continue
      if (isPreset(slug) || isCustom(slug)) removed.push(slug)
    }
    for (const slug of state.order) {
      if (typeof slug !== 'string' || order.includes(slug)) continue
      if (slug === CONFIG_SLUG || isPreset(slug) || isCustom(slug)) order.push(slug)
    }

    return {active: state.active, custom, removed, order}
  }),
)

/** The persisted themer state, or `null` for anything else @internal */
export function parseThemerState(input: unknown): ThemerState | null {
  const result = v.safeParse(themerStateSchema, input)

  return result.success ? result.output : null
}

/** The machine's state value, as persisted — only what the machine has states for restores @internal */
const snapshotValueSchema = v.object({
  flow: v.picklist(['list', 'edit', 'removed']),
  theme: v.picklist(['applied', 'switching']),
})

/**
 * The machine's persisted snapshot, as `getPersistedSnapshot()` writes it and
 * `createActor` restores it — `status`, `value`, `context`, `historyValue`
 * and `children`, with `output` and `error` left out as `undefined`.
 *
 * @internal
 */
export interface PersistedThemerSnapshot {
  status: 'active'
  output: undefined
  error: undefined
  value: v.InferOutput<typeof snapshotValueSchema>
  context: ThemerMachineContext
  historyValue: Record<string, never>
  children: Record<string, never>
}

/**
 * A snapshot for the machine to start a session from: the given themes, with
 * nothing being switched to, in the list unless a flow and its subject are
 * given. It is how the themes alone — all that earlier versions persisted —
 * are handed to a machine that only restores snapshots, and what a restored
 * snapshot is made fit for this session as.
 *
 * @internal
 */
export function snapshotFromState(
  state: ThemerState,
  editing: ThemerMachineContext['editing'] = null,
  flow: PersistedThemerSnapshot['value']['flow'] = 'list',
): PersistedThemerSnapshot {
  return {
    status: 'active',
    output: undefined,
    error: undefined,
    value: {flow, theme: 'applied'},
    context: {...state, editing, images: {}},
    historyValue: {},
    children: {},
  }
}

/**
 * The machine's snapshot as the last session persisted it, made fit for this
 * one: the themes are parsed like any persisted state, the flow keeps its
 * subject or falls back to the list, a switch that was under way is over,
 * and the image URLs of the last session are gone with it.
 *
 * @internal
 */
export const persistedSnapshotSchema = v.pipe(
  v.object({
    status: v.literal('active'),
    value: snapshotValueSchema,
    context: v.pipe(
      v.looseObject({
        editing: v.fallback(
          v.nullable(v.object({slug: v.string(), focusTitle: v.boolean()})),
          null,
        ),
      }),
      v.transform(({editing, ...state}) => ({editing, state: parseThemerState(state)})),
      v.check(({state}) => state !== null, 'no themes'),
    ),
  }),
  v.transform(({value, context}): PersistedThemerSnapshot => {
    // Checked above, but the type does not know
    const state = context.state ?? {active: null, custom: [], removed: [], order: []}
    const editing =
      context.editing &&
      state.custom.some((theme) => theme.slug === context.editing?.slug) &&
      !state.removed.includes(context.editing.slug)
        ? context.editing
        : null
    const flow =
      (value.flow === 'edit' && editing === null) ||
      (value.flow === 'removed' && state.removed.length === 0)
        ? 'list'
        : value.flow

    return snapshotFromState(state, editing, flow)
  }),
)
