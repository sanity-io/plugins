import {afterEach, describe, expect, it, vi} from 'vitest'
import {createActor} from 'xstate'
import {restoreActor} from 'xstate/persist'

import {presets} from '../theme/presets'
import {selectStoredState, switchesTheme, type ThemerEvent, themerMachine} from './machine'
import {snapshotFromState} from './schemas'
import {
  CONFIG_SLUG,
  type CustomTheme,
  initialThemerState,
  resolveThemes,
  type ThemerState,
} from './themes'

const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}
const verdant = presets.find((preset) => preset.slug === 'verdant')!

/** A machine started from nothing, or restored with the given themes — as a session with a persisted snapshot is */
function start(stored?: ThemerState) {
  return (
    stored ? restoreActor(themerMachine, snapshotFromState(stored)) : createActor(themerMachine)
  ).start()
}

/** Whether the event would cross-fade the Studio to another theme, and then sends it */
function send(actor: ReturnType<typeof start>, event: ThemerEvent) {
  const switches = switchesTheme(actor.getSnapshot(), event)
  actor.send(event)
  return switches
}

function startWithCustom(overrides: Partial<ThemerState> = {}) {
  return start({active: null, custom: [custom], removed: [], order: [], ...overrides})
}

describe('themerMachine', () => {
  it('starts in the list with no themes, and takes no input', () => {
    const snapshot = start().getSnapshot()

    expect(snapshot.matches('list')).toBe(true)
    expect(selectStoredState(snapshot)).toEqual(initialThemerState)
    expect(snapshot.context).toEqual({...initialThemerState, editing: null, images: {}})
  })

  it('picks up the themes of a restored snapshot, with the stored theme applied', () => {
    const stored: ThemerState = {
      active: 'verdant',
      custom: [custom],
      removed: ['dew'],
      order: ['dew', 'verdant'],
    }
    const actor = start(stored)
    const snapshot = actor.getSnapshot()

    expect(snapshot.matches('list')).toBe(true)
    expect(selectStoredState(snapshot)).toEqual(stored)
    expect(snapshot.context.editing).toBeNull()
  })

  describe('picking', () => {
    it('switches themes with a pick, not with an edit', () => {
      const actor = startWithCustom()

      expect(send(actor, {type: 'theme.pick', slug: 'custom-1'})).toBe(true)
      expect(
        send(actor, {
          type: 'theme.update',
          slug: 'custom-1',
          options: {light: {accent: '#00ff00'}},
        }),
      ).toBe(false)
      expect(send(actor, {type: 'theme.update', slug: 'custom-1', title: 'Ours'})).toBe(false)

      // Only what changes the applied theme is a switch: editing, duplicating or
      // picking the applied one, adding a copy of it, or removing another theme
      // leaves the Studio looking the same
      expect(send(actor, {type: 'theme.edit', slug: 'custom-1'})).toBe(false)
      expect(send(actor, {type: 'theme.pick', slug: 'custom-1'})).toBe(false)
      expect(send(actor, {type: 'theme.duplicate', slug: 'custom-1'})).toBe(false)
      expect(send(actor, {type: 'theme.add'})).toBe(false)
      expect(send(actor, {type: 'theme.remove', slug: 'verdant'})).toBe(false)

      expect(send(actor, {type: 'theme.add', options: {dark: {accent: '#0000ff'}}})).toBe(true)

      const applied = actor.getSnapshot().context.active!

      expect(send(actor, {type: 'theme.remove', slug: applied})).toBe(true)
      expect(send(actor, {type: 'theme.edit', slug: 'custom-1'})).toBe(true)
      expect(send(actor, {type: 'theme.delete', slug: 'custom-1'})).toBe(true)
    })

    it('previews a switch without running its effects', () => {
      const actor = start()
      const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

      actor.send({type: 'theme.add', title: 'sunset', imageUrl: 'blob:one'})
      const slug = actor.getSnapshot().context.active!
      actor.send({type: 'theme.pick', slug: 'verdant'})

      expect(switchesTheme(actor.getSnapshot(), {type: 'theme.delete', slug})).toBe(false)
      expect(revoke).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.images).toEqual({[slug]: 'blob:one'})
    })

    it('applies a theme, and picking the configured theme applies nothing', () => {
      const actor = start()

      actor.send({type: 'theme.pick', slug: 'verdant'})
      expect(actor.getSnapshot().context.active).toBe('verdant')

      actor.send({type: 'theme.pick', slug: CONFIG_SLUG})
      expect(actor.getSnapshot().context.active).toBeNull()
    })
  })

  describe('adding', () => {
    it('adds a theme based on the applied one and opens it in the editor', () => {
      const actor = start({...initialThemerState, active: 'verdant'})

      actor.send({type: 'theme.add'})

      const {context} = actor.getSnapshot()

      expect(actor.getSnapshot().matches('edit')).toBe(true)
      expect(context.custom).toHaveLength(1)
      expect(context.custom[0]).toMatchObject({title: 'Untitled theme', options: verdant.options})
      expect(context.custom[0].slug).toMatch(/^custom-/)
      expect(context.active).toBe(context.custom[0].slug)
      expect(context.editing).toEqual({slug: context.custom[0].slug, focusTitle: true})
    })

    it('adds a theme from given colors, like the palette of an image, without asking for a title', () => {
      const actor = start()
      const palette = {
        dominant: '#e11d48',
        vibrant: '#e11d48',
        lightVibrant: null,
        darkVibrant: null,
        muted: '#7a7e8a',
        lightMuted: null,
        darkMuted: null,
      }

      actor.send({
        type: 'theme.add',
        title: 'sunset beach',
        options: {light: {accent: '#e11d48'}},
        palette,
      })

      const {context} = actor.getSnapshot()

      expect(actor.getSnapshot().matches('edit')).toBe(true)
      expect(context.custom[0]).toMatchObject({
        title: 'sunset beach',
        options: {light: {accent: '#e11d48'}},
        palette,
      })
      expect(context.editing).toEqual({slug: context.custom[0].slug, focusTitle: false})

      actor.send({
        type: 'theme.update',
        slug: context.custom[0].slug,
        options: {dark: {accent: '#7a7e8a'}},
        palette: {...palette, vibrant: '#7a7e8a'},
      })
      expect(actor.getSnapshot().context.custom[0]).toMatchObject({
        options: {dark: {accent: '#7a7e8a'}},
        palette: {...palette, vibrant: '#7a7e8a'},
      })
    })

    it('keeps the image of a theme for the session, and lets it go with the theme', () => {
      const actor = start()
      const palette = {
        dominant: '#e11d48',
        vibrant: '#e11d48',
        lightVibrant: null,
        darkVibrant: null,
        muted: null,
        lightMuted: null,
        darkMuted: null,
      }

      const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

      actor.send({type: 'theme.add', title: 'sunset', palette, imageUrl: 'blob:one'})

      const slug = actor.getSnapshot().context.custom[0].slug

      expect(actor.getSnapshot().context.images).toEqual({[slug]: 'blob:one'})
      expect(selectStoredState(actor.getSnapshot())).not.toHaveProperty('images')

      // A new image releases the one it replaces
      actor.send({type: 'theme.update', slug, palette, imageUrl: 'blob:two'})
      expect(actor.getSnapshot().context.images).toEqual({[slug]: 'blob:two'})
      expect(revoke.mock.calls).toEqual([['blob:one']])

      actor.send({type: 'theme.update', slug: 'verdant', imageUrl: 'blob:nope'})
      expect(actor.getSnapshot().context.images).toEqual({[slug]: 'blob:two'})

      actor.send({type: 'theme.duplicate', slug})
      const copy = actor.getSnapshot().context.custom[1]

      expect(copy.palette).toEqual(palette)
      expect(actor.getSnapshot().context.images).toEqual({[slug]: 'blob:two'})

      actor.send({type: 'theme.remove', slug})
      actor.send({type: 'theme.delete', slug})
      expect(actor.getSnapshot().context.images).toEqual({})
      expect(revoke.mock.calls).toEqual([['blob:one'], ['blob:two']])
    })

    it('duplicates listed and removed themes into the editor', () => {
      const actor = startWithCustom({removed: ['custom-1']})

      actor.send({type: 'theme.duplicate', slug: 'verdant'})

      let {context} = actor.getSnapshot()

      expect(actor.getSnapshot().matches('edit')).toBe(true)
      expect(context.custom.at(-1)).toMatchObject({title: 'Verdant copy', options: verdant.options})
      expect(context.editing).toEqual({slug: context.active, focusTitle: true})

      actor.send({type: 'theme.duplicate', slug: 'custom-1'})
      context = actor.getSnapshot().context
      expect(context.custom.at(-1)).toMatchObject({title: 'Mine copy', options: custom.options})
      expect(context.custom).toHaveLength(3)
    })

    it('duplicates the configured theme, which is not in the list, into a stock copy', () => {
      const actor = start()

      actor.send({type: 'theme.duplicate', slug: CONFIG_SLUG})

      const {context} = actor.getSnapshot()

      expect(actor.getSnapshot().matches('edit')).toBe(true)
      expect(context.custom).toHaveLength(1)
      expect(context.custom[0]).toMatchObject({title: 'Studio config copy', options: {}})
      expect(context.editing).toEqual({slug: context.active, focusTitle: true})
    })

    it('does not open the editor when there is nothing to duplicate', () => {
      const actor = start()

      actor.send({type: 'theme.duplicate', slug: 'unknown'})

      expect(actor.getSnapshot().matches('list')).toBe(true)
      expect(actor.getSnapshot().context.custom).toEqual([])
      expect(actor.getSnapshot().context.editing).toBeNull()
    })
  })

  describe('editing', () => {
    it('edits and applies custom themes only', () => {
      const actor = startWithCustom()

      actor.send({type: 'theme.edit', slug: 'verdant'})
      expect(actor.getSnapshot().matches('list')).toBe(true)

      actor.send({type: 'theme.edit', slug: 'custom-1'})
      expect(actor.getSnapshot().matches('edit')).toBe(true)
      expect(actor.getSnapshot().context.active).toBe('custom-1')
      expect(actor.getSnapshot().context.editing).toEqual({slug: 'custom-1', focusTitle: false})
    })

    it('does not edit removed themes', () => {
      const actor = startWithCustom({removed: ['custom-1']})

      actor.send({type: 'theme.edit', slug: 'custom-1'})

      expect(actor.getSnapshot().matches('list')).toBe(true)
    })

    it('updates a theme, keeping the options identity when only the title changes', () => {
      const actor = startWithCustom()
      const {options} = actor.getSnapshot().context.custom[0]

      actor.send({type: 'theme.update', slug: 'custom-1', title: 'Ours'})
      expect(actor.getSnapshot().context.custom[0].title).toBe('Ours')
      expect(actor.getSnapshot().context.custom[0].options).toBe(options)

      actor.send({type: 'theme.update', slug: 'custom-1', options: {dark: {accent: '#00ff00'}}})
      expect(actor.getSnapshot().context.custom[0]).toEqual({
        slug: 'custom-1',
        title: 'Ours',
        options: {dark: {accent: '#00ff00'}},
      })

      actor.send({type: 'theme.update', slug: 'verdant', title: 'Nope'})
      expect(actor.getSnapshot().context.custom).toHaveLength(1)
    })

    it('leaves the editor when done, and when the theme is removed or deleted', () => {
      const actor = startWithCustom()

      actor.send({type: 'theme.edit', slug: 'custom-1'})
      actor.send({type: 'flow.list'})
      expect(actor.getSnapshot().matches('list')).toBe(true)
      expect(actor.getSnapshot().context.editing).toBeNull()

      actor.send({type: 'theme.edit', slug: 'custom-1'})
      actor.send({type: 'theme.remove', slug: 'custom-1'})
      expect(actor.getSnapshot().matches('list')).toBe(true)
      expect(actor.getSnapshot().context.editing).toBeNull()
      expect(actor.getSnapshot().context.active).toBeNull()

      actor.send({type: 'theme.restore', slug: 'custom-1'})
      actor.send({type: 'theme.edit', slug: 'custom-1'})
      actor.send({type: 'theme.delete', slug: 'custom-1'})
      expect(actor.getSnapshot().matches('list')).toBe(true)
      expect(actor.getSnapshot().context.custom).toEqual([])
    })

    it('stays in the editor while other themes come and go', () => {
      const actor = startWithCustom({active: 'custom-1'})

      actor.send({type: 'theme.edit', slug: 'custom-1'})
      actor.send({type: 'theme.remove', slug: 'verdant'})

      expect(actor.getSnapshot().matches('edit')).toBe(true)
      expect(actor.getSnapshot().context.active).toBe('custom-1')
    })
  })

  describe('persisting', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('never touches storage — its snapshot is persisted around it', () => {
      const storage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      vi.stubGlobal('localStorage', storage)

      const actor = startWithCustom()
      actor.send({type: 'theme.pick', slug: 'custom-1'})
      actor.send({type: 'theme.reorder', order: ['custom-1', CONFIG_SLUG]})
      actor.send({type: 'theme.remove', slug: 'custom-1'})

      expect(storage.getItem).not.toHaveBeenCalled()
      expect(storage.setItem).not.toHaveBeenCalled()
      expect(storage.removeItem).not.toHaveBeenCalled()
      // What there is to persist is a plain snapshot of the machine
      expect(JSON.parse(JSON.stringify(actor.getPersistedSnapshot()))).toMatchObject({
        status: 'active',
        value: {list: 'idle'},
        context: selectStoredState(actor.getSnapshot()),
      })
    })
  })

  describe('syncing with other tabs', () => {
    it('takes over the persisted state of another tab, and nothing of this one', () => {
      const actor = startWithCustom()
      actor.send({type: 'theme.add', imageUrl: 'blob:mine'})
      const mine = actor.getSnapshot().context.active!

      const theirs: ThemerState = {
        active: 'verdant',
        custom: [custom, {slug: 'custom-9', title: 'Theirs', options: {dark: {accent: '#00ff00'}}}],
        removed: ['dew'],
        order: ['verdant', CONFIG_SLUG],
      }
      actor.send({type: 'themes.sync', state: theirs})

      expect(selectStoredState(actor.getSnapshot())).toEqual(theirs)
      // This tab's images and flow are its own
      expect(actor.getSnapshot().context.images).toEqual({[mine]: 'blob:mine'})
      expect(actor.getSnapshot().matches('list')).toBe(true)
    })

    it('is a switch when the other tab applied another theme, not when it edited the applied one', () => {
      const actor = startWithCustom({active: 'custom-1'})

      expect(
        send(actor, {
          type: 'themes.sync',
          state: {
            active: 'custom-1',
            custom: [{...custom, options: {light: {accent: '#00ff00'}}}],
            removed: [],
            order: [],
          },
        }),
      ).toBe(false)
      expect(actor.getSnapshot().context.custom[0].options).toEqual({light: {accent: '#00ff00'}})

      expect(
        send(actor, {
          type: 'themes.sync',
          state: {active: 'verdant', custom: [custom], removed: [], order: []},
        }),
      ).toBe(true)
      expect(actor.getSnapshot().context.active).toBe('verdant')

      // Picking the configured theme elsewhere is a switch too
      expect(
        send(actor, {
          type: 'themes.sync',
          state: {active: null, custom: [custom], removed: [], order: []},
        }),
      ).toBe(true)
    })

    it('leaves the editor when the other tab took its theme away', () => {
      const actor = startWithCustom()
      actor.send({type: 'theme.edit', slug: 'custom-1'})
      expect(actor.getSnapshot().matches('edit')).toBe(true)

      actor.send({
        type: 'themes.sync',
        state: {active: 'custom-1', custom: [custom], removed: ['custom-1'], order: []},
      })

      expect(actor.getSnapshot().matches('list')).toBe(true)
      expect(actor.getSnapshot().context.editing).toBeNull()
    })

    it('leaves the removed themes when the other tab restored the last one', () => {
      const actor = startWithCustom({removed: ['verdant']})
      actor.send({type: 'flow.removed'})
      expect(actor.getSnapshot().matches('removed')).toBe(true)

      actor.send({
        type: 'themes.sync',
        state: {active: null, custom: [custom], removed: [], order: []},
      })

      expect(actor.getSnapshot().matches('list')).toBe(true)
    })
  })

  describe('importing', () => {
    it('adds and applies a shared theme without opening the editor', () => {
      const actor = start()

      expect(
        send(actor, {type: 'theme.import', title: 'Shared', options: {dark: {accent: '#ff0000'}}}),
      ).toBe(true)

      const snapshot = actor.getSnapshot()
      const stored = selectStoredState(snapshot)

      expect(snapshot.matches('list')).toBe(true)
      expect(stored.custom).toHaveLength(1)
      expect(stored.custom[0]).toMatchObject({
        title: 'Shared',
        options: {dark: {accent: '#ff0000'}},
      })
      expect(stored.active).toBe(stored.custom[0].slug)
      expect(snapshot.context.editing).toBeNull()
    })

    it('takes the slug a sender gives the theme', () => {
      const actor = start()

      actor.send({type: 'theme.import', title: 'Shared', options: {}, slug: 'custom-known'})

      expect(actor.getSnapshot().context.active).toBe('custom-known')
      expect(actor.getSnapshot().context.custom[0].slug).toBe('custom-known')
    })
  })

  describe("the list's dialogs", () => {
    it('opens and closes the paste dialog, in the list', () => {
      const actor = start()

      expect(actor.getSnapshot().matches({list: 'idle'})).toBe(true)

      actor.send({type: 'dialog.paste'})
      expect(actor.getSnapshot().matches({list: 'pasting'})).toBe(true)
      expect(actor.getSnapshot().matches('list')).toBe(true)

      actor.send({type: 'dialog.close'})
      expect(actor.getSnapshot().matches({list: 'idle'})).toBe(true)
    })

    it('shows the snippet of the applied theme only — the configured theme has none', () => {
      const actor = startWithCustom()

      actor.send({type: 'dialog.snippet'})
      expect(actor.getSnapshot().matches({list: 'idle'})).toBe(true)

      actor.send({type: 'theme.pick', slug: 'custom-1'})
      actor.send({type: 'dialog.snippet'})
      expect(actor.getSnapshot().matches({list: 'snippet'})).toBe(true)

      // The applied theme goes away under the dialog — removed from another tab
      actor.send({type: 'themes.sync', state: {...initialThemerState, custom: [custom]}})
      expect(actor.getSnapshot().matches({list: 'idle'})).toBe(true)
    })

    it('closes a dialog by leaving the list', () => {
      const actor = startWithCustom()

      actor.send({type: 'dialog.paste'})
      actor.send({type: 'theme.add'})
      expect(actor.getSnapshot().matches('edit')).toBe(true)

      actor.send({type: 'flow.list'})
      expect(actor.getSnapshot().matches({list: 'idle'})).toBe(true)
    })
  })

  describe('rearranging', () => {
    it('stores the order the listed themes were dragged into', () => {
      const actor = startWithCustom()
      const slugs = () =>
        resolveThemes(actor.getSnapshot().context).themes.map((theme) => theme.slug)
      const [first, second, ...rest] = slugs()

      actor.send({type: 'theme.reorder', order: ['custom-1', second, first, ...rest.slice(0, -1)]})
      expect(slugs()).toEqual(['custom-1', second, first, ...rest.slice(0, -1)])
      expect(selectStoredState(actor.getSnapshot()).order).toEqual([
        'custom-1',
        second,
        first,
        ...rest.slice(0, -1),
      ])
    })

    it('ignores slugs that are not listed, and keeps removed themes in line', () => {
      const actor = startWithCustom({removed: ['dew'], order: ['dew', 'custom-1']})

      actor.send({type: 'theme.reorder', order: ['verdant', 'unknown', 'dew', 'custom-1']})
      expect(selectStoredState(actor.getSnapshot()).order).toEqual(['verdant', 'custom-1', 'dew'])

      actor.send({type: 'theme.restore', slug: 'dew'})
      expect(
        resolveThemes(actor.getSnapshot().context)
          .themes.slice(0, 3)
          .map((theme) => theme.slug),
      ).toEqual(['verdant', 'custom-1', 'dew'])
    })
  })

  describe('removing and restoring', () => {
    it('removes themes, falling back to the configured theme when the applied one goes', () => {
      const actor = startWithCustom({active: 'custom-1'})

      actor.send({type: 'theme.remove', slug: CONFIG_SLUG})
      expect(actor.getSnapshot().context.removed).toEqual([])

      actor.send({type: 'theme.remove', slug: 'verdant'})
      expect(actor.getSnapshot().context.active).toBe('custom-1')

      actor.send({type: 'theme.remove', slug: 'custom-1'})
      actor.send({type: 'theme.remove', slug: 'custom-1'})
      expect(selectStoredState(actor.getSnapshot())).toEqual({
        active: null,
        custom: [custom],
        removed: ['verdant', 'custom-1'],
        order: [],
      })
    })

    it('only shows the removed themes while there are some', () => {
      const actor = startWithCustom()

      actor.send({type: 'flow.removed'})
      expect(actor.getSnapshot().matches('list')).toBe(true)

      actor.send({type: 'theme.remove', slug: 'verdant'})
      actor.send({type: 'theme.remove', slug: 'custom-1'})
      actor.send({type: 'flow.removed'})
      expect(actor.getSnapshot().matches('removed')).toBe(true)

      actor.send({type: 'theme.restore', slug: 'verdant'})
      expect(actor.getSnapshot().matches('removed')).toBe(true)
      expect(actor.getSnapshot().context.removed).toEqual(['custom-1'])

      actor.send({type: 'theme.delete', slug: 'custom-1'})
      expect(actor.getSnapshot().matches('list')).toBe(true)
      expect(selectStoredState(actor.getSnapshot())).toEqual(initialThemerState)
    })

    it('deletes custom themes only', () => {
      const actor = startWithCustom({active: 'custom-1', removed: ['custom-1']})

      actor.send({type: 'theme.delete', slug: 'verdant'})
      expect(actor.getSnapshot().context.removed).toEqual(['custom-1'])

      actor.send({type: 'theme.delete', slug: 'custom-1'})
      expect(selectStoredState(actor.getSnapshot())).toEqual(initialThemerState)
    })
  })
})
