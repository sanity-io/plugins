import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createActor} from 'xstate'

import {themerMachine} from './machine'
import {hasVisited, markVisited, readPersistedThemer, writePersistedSnapshot} from './storage'
import {type CustomTheme, initialThemerState, type ThemerState} from './themes'

const SNAPSHOT_STORAGE_KEY = 'sanityStudio:themer:snapshot'
const STATE_STORAGE_KEY = 'sanityStudio:themer:state'
const LEGACY_STORAGE_KEY = 'sanityStudio:themer:options'
const VISITED_STORAGE_KEY = 'sanityStudio:themer:visited'

const baseOptions = {light: {accent: '#123456'}}
const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()

  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

/** A session of the machine, started from the given state or snapshot — what the real one persists */
function runMachine(persisted = readPersistedThemer(baseOptions)) {
  return createActor(themerMachine, {
    input: {baseOptions, stored: persisted.state},
    snapshot: persisted.snapshot,
  }).start()
}

describe('themer storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts from the initial state', () => {
    expect(readPersistedThemer(baseOptions)).toEqual({
      snapshot: undefined,
      state: initialThemerState,
    })
  })

  it('does without storage', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(readPersistedThemer(baseOptions).state).toEqual(initialThemerState)
    expect(() => writePersistedSnapshot(runMachine().getPersistedSnapshot())).not.toThrow()
  })

  describe('the snapshot of the last session', () => {
    it('restores the machine where it left off, with the themes of this session', () => {
      const actor = runMachine()
      actor.send({type: 'theme.import', title: 'Shared', options: {dark: {accent: '#00ff00'}}})
      actor.send({type: 'theme.edit', slug: actor.getSnapshot().context.active!})
      actor.send({
        type: 'theme.update',
        slug: actor.getSnapshot().context.active!,
        imageUrl: 'blob:one',
      })

      writePersistedSnapshot(actor.getPersistedSnapshot())

      const persisted = readPersistedThemer({light: {accent: '#654321'}})
      const restored = runMachine(persisted).getSnapshot()
      const {active} = restored.context

      expect(active).toBe(actor.getSnapshot().context.active)
      expect(persisted.state).toEqual({
        active,
        custom: [{slug: active, title: 'Shared', options: {dark: {accent: '#00ff00'}}}],
        removed: [],
        order: [],
      })
      // The editor is where the session ended, not switching to anything
      expect(restored.matches({flow: 'edit', theme: 'applied'})).toBe(true)
      expect(restored.context.editing).toEqual({slug: active, focusTitle: false})
      // The configured theme is this session's, and the images were the last one's
      expect(restored.context.baseOptions).toEqual({light: {accent: '#654321'}})
      expect(restored.context.images).toEqual({})
    })

    it('leaves a flow that lost its subject', () => {
      const actor = runMachine()
      actor.send({type: 'theme.add'})
      const snapshot = actor.getPersistedSnapshot()

      localStorage.setItem(
        SNAPSHOT_STORAGE_KEY,
        JSON.stringify({...snapshot, context: {...actor.getSnapshot().context, custom: []}}),
      )

      const persisted = readPersistedThemer(baseOptions)

      expect(persisted.snapshot?.value).toEqual({flow: 'list', theme: 'applied'})
      expect(persisted.snapshot?.context.editing).toBeNull()
      expect(runMachine(persisted).getSnapshot().matches({flow: 'list'})).toBe(true)
    })

    it('keeps the themes of a snapshot the machine has no states for', () => {
      localStorage.setItem(
        SNAPSHOT_STORAGE_KEY,
        JSON.stringify({
          status: 'active',
          value: {flow: 'wizard', theme: 'applied'},
          context: {active: 'custom-1', custom: [custom], removed: [], order: []},
          children: {},
        }),
      )

      const persisted = readPersistedThemer(baseOptions)

      expect(persisted.snapshot).toBeUndefined()
      expect(persisted.state).toEqual({
        active: 'custom-1',
        custom: [custom],
        removed: [],
        order: [],
      })
      expect(runMachine(persisted).getSnapshot().context.active).toBe('custom-1')
    })

    it('falls back on a corrupt snapshot', () => {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, '{not json')

      expect(readPersistedThemer(baseOptions).state).toEqual(initialThemerState)
    })

    it('takes over from what earlier versions stored once written', () => {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({active: null, custom: [custom]}))
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({accent: '#1cb485'}))

      const actor = runMachine()
      expect(actor.getSnapshot().context.custom).toEqual([custom])

      writePersistedSnapshot(actor.getPersistedSnapshot())

      expect(localStorage.getItem(STATE_STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
      expect(readPersistedThemer(baseOptions).state.custom).toEqual([custom])
    })
  })

  describe('the state of earlier versions', () => {
    function readState(): ThemerState {
      const persisted = readPersistedThemer(baseOptions)

      expect(persisted.snapshot).toBeUndefined()

      return persisted.state
    }

    it('reads the state as it was', () => {
      const state: ThemerState = {
        active: 'custom-1',
        custom: [
          {
            slug: 'custom-1',
            title: 'Mine',
            options: {
              light: {accent: '#ff0000', text: '#333333', contrast: 70},
              dark: {background: '#000000'},
            },
          },
          {slug: 'custom-2', title: 'Stock', options: {}},
        ],
        removed: ['verdant', 'custom-1'],
        order: ['custom-2', 'config', 'verdant'],
      }

      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state))

      expect(readState()).toEqual(state)
    })

    it('drops what it cannot use', () => {
      localStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify({
          active: 42,
          custom: [
            {
              slug: 'custom-1',
              title: 'Valid',
              options: {light: {accent: '#FF0000', contrast: 500}, dark: {background: 'nope'}},
            },
            {slug: 'custom-1', title: 'Duplicate', options: {light: {accent: '#00ff00'}}},
            {slug: 'verdant', title: 'Reserved slug', options: {light: {accent: '#00ff00'}}},
            {slug: 'config', title: 'Reserved slug', options: {light: {accent: '#00ff00'}}},
            {slug: 'custom-2', title: 'Stock', options: {}},
            {slug: 'custom-3', title: '   ', options: {dark: {accent: '#00f', text: 'nope'}}},
            {slug: 'custom-4', title: 'No options'},
            'garbage',
          ],
          removed: ['verdant', 'verdant', 'unknown', 'config', 'custom-3', 7],
          order: ['custom-3', 'unknown', 'dew', 'custom-3', 'custom-4', 'config', 3],
        }),
      )

      expect(readState()).toEqual({
        active: null,
        custom: [
          {slug: 'custom-1', title: 'Valid', options: {light: {accent: '#ff0000', contrast: 100}}},
          {slug: 'custom-2', title: 'Stock', options: {}},
          {slug: 'custom-3', title: 'Untitled theme', options: {dark: {accent: '#00f'}}},
        ],
        removed: ['verdant', 'custom-3'],
        order: ['custom-3', 'dew', 'config'],
      })
    })

    it('keeps the image palette of a theme, dropping what is not a color', () => {
      localStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify({
          active: null,
          custom: [
            {
              slug: 'custom-1',
              title: 'From image',
              options: {},
              palette: {dominant: '#E11D48', vibrant: 'red', muted: null, extra: '#000000'},
            },
            {slug: 'custom-2', title: 'No colors', options: {}, palette: {vibrant: 'nope'}},
            {slug: 'custom-3', title: 'No palette', options: {}, palette: 'garbage'},
          ],
          removed: [],
        }),
      )

      expect(readState().custom).toEqual([
        {
          slug: 'custom-1',
          title: 'From image',
          options: {},
          palette: {
            dominant: '#e11d48',
            vibrant: null,
            lightVibrant: null,
            darkVibrant: null,
            muted: null,
            lightMuted: null,
            darkMuted: null,
          },
        },
        {slug: 'custom-2', title: 'No colors', options: {}},
        {slug: 'custom-3', title: 'No palette', options: {}},
      ])
    })

    it('falls back on corrupt storage', () => {
      localStorage.setItem(STATE_STORAGE_KEY, '{not json')

      expect(readState()).toEqual(initialThemerState)
    })

    it('migrates the draft of the earliest versions into a custom theme', () => {
      localStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({accent: '#1cb485', contrast: 70, background: {dark: '#0d1415'}}),
      )

      const state = readState()

      expect(state.custom).toHaveLength(1)
      expect(state.custom[0]).toMatchObject({
        // The same slug whichever tab reads it first, so tabs upgrading together agree
        slug: 'custom-draft',
        title: 'Draft theme',
        options: {
          light: {accent: '#1cb485', contrast: 70},
          dark: {accent: '#1cb485', contrast: 70, background: '#0d1415'},
        },
      })
      expect(state.active).toBe(state.custom[0].slug)
      expect(state.removed).toEqual([])
      expect(state.order).toEqual([])
    })

    it('ignores an unusable legacy draft', () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({accent: 'blue'}))

      expect(readState()).toEqual(initialThemerState)
    })

    it('converts custom themes stored with the flat options of earlier versions', () => {
      localStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify({
          active: 'custom-1',
          custom: [
            {
              slug: 'custom-1',
              title: 'Flat',
              options: {accent: '#1cb485', text: '#5c9199', background: {light: '#fcfdfd'}},
            },
            {slug: 'custom-2', title: 'Flat gone wrong', options: {accent: 'blue'}},
          ],
          removed: [],
        }),
      )

      expect(readState().custom).toEqual([
        {
          slug: 'custom-1',
          title: 'Flat',
          options: {
            light: {accent: '#1cb485', text: '#5c9199', background: '#fcfdfd'},
            dark: {accent: '#1cb485', text: '#5c9199'},
          },
        },
      ])
    })
  })
})

describe('themer visit', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is not noted until the sidebar has been opened', () => {
    expect(hasVisited()).toBe(false)

    markVisited()

    expect(hasVisited()).toBe(true)
  })

  it('keeps the time of the first visit', () => {
    vi.useFakeTimers()

    try {
      vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'))
      markVisited()
      vi.setSystemTime(new Date('2026-09-26T12:00:00.000Z'))
      markVisited()

      expect(localStorage.getItem(VISITED_STORAGE_KEY)).toBe('2026-09-25T12:00:00.000Z')
    } finally {
      vi.useRealTimers()
    }
  })

  it('counts any note as a visit', () => {
    localStorage.setItem(VISITED_STORAGE_KEY, 'yes')

    expect(hasVisited()).toBe(true)
  })

  it('does without storage', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(hasVisited()).toBe(false)
    expect(() => markVisited()).not.toThrow()
  })

  it('shrugs off storage that throws', () => {
    const storage = createMemoryStorage()
    const throwing = () => {
      throw new Error('denied')
    }

    storage.getItem = throwing
    storage.setItem = throwing
    vi.stubGlobal('localStorage', storage)

    expect(hasVisited()).toBe(false)
    expect(() => markVisited()).not.toThrow()
  })
})
