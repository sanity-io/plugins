import * as v from 'valibot'
import type {Snapshot} from 'xstate'

import type {BuildThemeOptions} from '../theme/options'
import {
  parseThemerState,
  type PersistedThemerSnapshot,
  persistedSnapshotSchema,
  themeOptionsSchema,
} from './schemas'
import {type CustomTheme, initialThemerState, type ThemerState} from './themes'

/** Where the machine's snapshot is kept between sessions */
const SNAPSHOT_STORAGE_KEY = 'sanityStudio:themer:snapshot'

/**
 * Where earlier versions kept the persisted state — the applied theme, the
 * user's themes and what was removed and reordered — before the machine's
 * whole snapshot was persisted. Read until the first snapshot is written.
 */
const STATE_STORAGE_KEY = 'sanityStudio:themer:state'

/**
 * Where the earliest versions of the tool kept their single draft theme — it
 * is migrated into a custom theme, so a draft survives the upgrade.
 */
const LEGACY_STORAGE_KEY = 'sanityStudio:themer:options'

/**
 * What the draft of the earliest versions is imported as — the same theme
 * whichever tab reads it first, so that tabs upgrading side by side agree
 */
const LEGACY_DRAFT: Omit<CustomTheme, 'options'> = {slug: 'custom-draft', title: 'Draft theme'}

/**
 * Where it is noted that the sidebar has been opened at least once — until
 * then, the navbar introduces the tool with an animation of its icon
 */
const VISITED_STORAGE_KEY = 'sanityStudio:themer:visited'

/** What an earlier session left for this one to start from @internal */
export interface PersistedThemer {
  /**
   * The machine's snapshot, when the last session persisted one that still
   * fits the machine — restored, the machine picks up where it left off
   */
  snapshot: PersistedThemerSnapshot | undefined
  /**
   * The persisted themes — from the snapshot, or from what earlier versions
   * stored — which the machine starts from without a snapshot, and the tool
   * reducer applies before the machine has published anything
   */
  state: ThemerState
}

const NOTHING_PERSISTED: PersistedThemer = {snapshot: undefined, state: initialThemerState}

function readJson(key: string): unknown {
  const raw = localStorage.getItem(key)

  return raw ? JSON.parse(raw) : undefined
}

/**
 * Restores what the last session persisted, so the user's themes survive
 * Studio reloads: the machine's snapshot where there is one that fits, the
 * themes alone where the snapshot no longer fits the machine, and what
 * earlier versions of the tool stored where there is no snapshot yet. Falls
 * back to the initial state when nothing usable is stored — or storage
 * cannot be read at all.
 *
 * The parsing is the schemas' (see `schemas.ts`): nothing here or in the
 * machine looks at what is stored beyond handing it over.
 *
 * @internal
 */
export function readPersistedThemer(baseOptions: BuildThemeOptions): PersistedThemer {
  try {
    if (typeof localStorage === 'undefined') return NOTHING_PERSISTED

    const persisted = readJson(SNAPSHOT_STORAGE_KEY)

    if (persisted !== undefined) {
      const snapshot = v.safeParse(persistedSnapshotSchema(baseOptions), persisted)

      if (snapshot.success) {
        const {active, custom, removed, order} = snapshot.output.context

        return {snapshot: snapshot.output, state: {active, custom, removed, order}}
      }

      // A snapshot from a version of the machine with other states still
      // holds the themes, which is what matters
      const state = parseThemerState(
        persisted && typeof persisted === 'object' ? Reflect.get(persisted, 'context') : undefined,
      )

      if (state) return {snapshot: undefined, state}
    }

    const state = parseThemerState(readJson(STATE_STORAGE_KEY))

    if (state) return {snapshot: undefined, state}

    return readLegacyDraft() ?? NOTHING_PERSISTED
  } catch {
    return NOTHING_PERSISTED
  }
}

function readLegacyDraft(): PersistedThemer | null {
  const options = v.safeParse(themeOptionsSchema, readJson(LEGACY_STORAGE_KEY))

  if (!options.success) return null

  const theme: CustomTheme = {...LEGACY_DRAFT, options: options.output}

  return {snapshot: undefined, state: {active: theme.slug, custom: [theme], removed: [], order: []}}
}

/**
 * Persists the machine's snapshot for the next session, and lets go of what
 * earlier versions stored once it is written — which completes their
 * migration.
 *
 * @internal
 */
export function writePersistedSnapshot(snapshot: Snapshot<unknown>): void {
  try {
    if (typeof localStorage === 'undefined') return

    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot))
    localStorage.removeItem(STATE_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Storage can be unavailable (e.g. private browsing) — themes just won't persist
  }
}

/**
 * Whether the themer sidebar has been opened before, in any session — the
 * cue for the navbar to stop introducing the tool.
 *
 * @internal
 */
export function hasVisited(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(VISITED_STORAGE_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Notes that the themer sidebar has been opened, keeping the time it first
 * was.
 *
 * @internal
 */
export function markVisited(): void {
  try {
    if (typeof localStorage === 'undefined' || localStorage.getItem(VISITED_STORAGE_KEY) !== null) {
      return
    }

    localStorage.setItem(VISITED_STORAGE_KEY, new Date().toISOString())
  } catch {
    // Storage can be unavailable (e.g. private browsing) — the tool is introduced again next time
  }
}
