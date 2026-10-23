import * as v from 'valibot'
import type {Snapshot} from 'xstate'

import {
  parseThemerState,
  type PersistedThemerSnapshot,
  persistedSnapshotSchema,
  snapshotFromState,
  themeOptionsSchema,
} from './schemas'
import type {CustomTheme} from './themes'

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

function readJson(key: string): unknown {
  const raw = localStorage.getItem(key)

  return raw ? JSON.parse(raw) : undefined
}

/**
 * Restores the machine's snapshot from what the last session persisted, for
 * `createActor` to start from, so the user's themes survive Studio reloads:
 * the snapshot itself where there is one that fits, and one made from the
 * themes alone where the snapshot no longer fits the machine or where
 * earlier versions of the tool stored the themes without a snapshot.
 * `undefined` when nothing usable is stored — or storage cannot be read at
 * all — leaves the machine to start from no themes.
 *
 * The parsing is the schemas' (see `schemas.ts`): nothing here or in the
 * machine looks at what is stored beyond handing it over.
 *
 * @internal
 */
export function readPersistedSnapshot(): PersistedThemerSnapshot | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined

    const persisted = readJson(SNAPSHOT_STORAGE_KEY)

    if (persisted !== undefined) {
      const snapshot = v.safeParse(persistedSnapshotSchema, persisted)

      if (snapshot.success) return snapshot.output

      // A snapshot from a version of the machine with other states still
      // holds the themes, which is what matters
      const state = parseThemerState(
        persisted && typeof persisted === 'object' ? Reflect.get(persisted, 'context') : undefined,
      )

      if (state) return snapshotFromState(state)
    }

    const state = parseThemerState(readJson(STATE_STORAGE_KEY))

    if (state) return snapshotFromState(state)

    return readLegacyDraft()
  } catch {
    return undefined
  }
}

function readLegacyDraft(): PersistedThemerSnapshot | undefined {
  const options = v.safeParse(themeOptionsSchema, readJson(LEGACY_STORAGE_KEY))

  if (!options.success) return undefined

  const theme: CustomTheme = {...LEGACY_DRAFT, options: options.output}

  return snapshotFromState({active: theme.slug, custom: [theme], removed: [], order: []})
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
