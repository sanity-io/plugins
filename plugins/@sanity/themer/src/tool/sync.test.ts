import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createActor, type Snapshot} from 'xstate'

import {selectStoredState, themerMachine} from './machine'
import {parseThemerState, snapshotFromState} from './schemas'
import {type SyncChannel, type SyncLocks, syncThemer} from './sync'
import {type CustomTheme, initialThemerState, type ThemerState} from './themes'

const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}

/** Lets the fake channel deliver and the fake locks grant, both of which take a turn of the loop */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** The tab a hello is from */
function helloFrom(message: unknown): string {
  if (
    message &&
    typeof message === 'object' &&
    'from' in message &&
    typeof message.from === 'string'
  ) {
    return message.from
  }

  throw new Error('Not a hello')
}

/** Persists right away, where the sync would wait for an idle moment */
const immediately = (callback: () => void) => {
  callback()

  return () => {}
}

/** A `BroadcastChannel` stand-in: every channel on a bus hears what the others post */
function createBus() {
  const channels = new Set<{listeners: Set<(data: unknown) => void>}>()

  return {
    open: (): SyncChannel & {posted: unknown[]} => {
      const listeners = new Set<(data: unknown) => void>()
      const self = {listeners}
      const posted: unknown[] = []

      channels.add(self)

      return {
        posted,
        post(message) {
          posted.push(message)
          for (const other of channels) {
            if (other === self) continue
            for (const listener of other.listeners) {
              setTimeout(() => listener(structuredClone(message)), 0)
            }
          }
        },
        listen(listener) {
          listeners.add(listener)

          return () => listeners.delete(listener)
        },
        close() {
          channels.delete(self)
          listeners.clear()
        },
      }
    },
    /** Something another page put on the channel */
    broadcast: (message: unknown) => {
      for (const channel of channels) {
        for (const listener of channel.listeners) setTimeout(() => listener(message), 0)
      }
    },
  }
}

/** A `navigator.locks` stand-in: one holder per name, the rest queue in order */
function createLocks(grantDelay = 0): SyncLocks {
  const queues = new Map<string, Array<() => void>>()
  const held = new Set<string>()

  const grantNext = (name: string) => {
    if (held.has(name)) return

    const next = queues.get(name)?.shift()

    if (next) next()
  }

  return {
    request(name, options, callback) {
      return new Promise((resolve, reject) => {
        let granted = false
        const grant = () => {
          granted = true
          held.add(name)
          void (async () => {
            const value = await callback()

            held.delete(name)
            resolve(value)
            grantNext(name)
          })()
        }

        options.signal?.addEventListener('abort', () => {
          if (granted) return

          const queue = queues.get(name) ?? []

          queues.set(
            name,
            queue.filter((waiting) => waiting !== grant),
          )
          reject(new Error('aborted'))
        })

        queues.set(name, [...(queues.get(name) ?? []), grant])
        setTimeout(() => grantNext(name), grantDelay)
      })
    },
  }
}

/** A tab's machine, restored with the given themes — as a session with a persisted snapshot is */
function startTab(stored: ThemerState = initialThemerState) {
  return createActor(themerMachine, {snapshot: snapshotFromState(stored)}).start()
}

/** A page that can go into the back/forward cache and come back */
function createPage() {
  const target = new EventTarget()
  let cached = false

  return {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    hide: () => {
      cached = true
      target.dispatchEvent(Object.assign(new Event('pagehide'), {persisted: true}))
    },
    show: () => {
      cached = false
      target.dispatchEvent(Object.assign(new Event('pageshow'), {persisted: true}))
    },
    /** Opens the page's channel on a bus: frozen, the page hears nothing of what is posted */
    open: (open: () => SyncChannel) => (): SyncChannel => {
      const channel = open()

      return {
        ...channel,
        listen: (listener) =>
          channel.listen((data) => {
            if (!cached) listener(data)
          }),
      }
    },
  }
}

/** A `localStorage` stand-in: what the holder persists, and a tab back from the cache reads */
function createStore() {
  let snapshot: Snapshot<unknown> | undefined

  return {
    persist: (next: Snapshot<unknown>) => {
      snapshot = next
    },
    restore: (): ThemerState | undefined =>
      snapshot ? (parseThemerState(Reflect.get(snapshot, 'context')) ?? undefined) : undefined,
  }
}

describe('syncing the themer across tabs', () => {
  beforeEach(() => {
    // Node 24 has `navigator.locks` too — the sync must only use what it is given
    vi.stubGlobal('navigator', {locks: {request: () => new Promise(() => {})}})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists from the tab that holds the lock, and from that tab only', async () => {
    const bus = createBus()
    const locks = createLocks()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})
    const persistA = vi.fn<(snapshot: Snapshot<unknown>) => void>()
    const persistB = vi.fn<(snapshot: Snapshot<unknown>) => void>()

    const stopA = syncThemer(tabA, {
      persist: persistA,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: persistB,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    // The holder persists as it takes the lock, in case the last holder left with a write pending
    expect(persistA).toHaveBeenCalledTimes(1)
    expect(persistB).not.toHaveBeenCalled()

    // What the other tab changes reaches the holder's machine, and storage from there
    tabB.send({type: 'theme.pick', slug: 'custom-1'})
    await tick()

    expect(tabA.getSnapshot().context.active).toBe('custom-1')
    expect(persistA).toHaveBeenCalledTimes(2)
    expect(persistB).not.toHaveBeenCalled()
    expect(persistA.mock.lastCall?.[0]).toMatchObject({
      context: {active: 'custom-1', custom: [custom]},
    })

    // And the holder's changes reach the other tab
    tabA.send({type: 'theme.reorder', order: ['custom-1', 'config']})
    await tick()

    expect(selectStoredState(tabB.getSnapshot())).toEqual(selectStoredState(tabA.getSnapshot()))
    expect(persistB).not.toHaveBeenCalled()

    stopA()
    stopB()
  })

  it('hands the themes around once, without echoing them back', async () => {
    const bus = createBus()
    const locks = createLocks()
    const channelA = bus.open()
    const channelB = bus.open()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: () => channelA,
      locks,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: () => {},
      openChannel: () => channelB,
      locks,
      schedule: immediately,
    })
    await tick()

    tabB.send({type: 'theme.pick', slug: 'custom-1'})
    // Changes to the flow are the tab's own business
    tabB.send({type: 'theme.edit', slug: 'custom-1'})
    tabA.send({type: 'flow.removed'})
    await tick()

    const stateB = selectStoredState(tabB.getSnapshot())

    expect(channelB.posted).toEqual([
      {type: 'hello', from: expect.any(String)},
      {type: 'state', state: stateB, revision: 1, from: expect.any(String)},
      // The holder's answer to the hello came after the change, so the change went around once more
      {type: 'state', state: stateB, revision: 2, from: expect.any(String)},
    ])
    // The holder answered the other tab's hello, and said nothing of what it heard from it
    expect(channelA.posted).toEqual([
      {type: 'hello', from: expect.any(String)},
      {
        type: 'state',
        state: {...initialThemerState, custom: [custom]},
        revision: 0,
        from: expect.any(String),
        to: expect.any(String),
      },
    ])
    expect(tabA.getSnapshot().context.active).toBe('custom-1')
    expect(tabA.getSnapshot().matches({flow: 'list'})).toBe(true)

    stopA()
    stopB()
  })

  it('answers the hellos it heard before it held the lock', async () => {
    const bus = createBus()
    // The lock takes longer to come through than the hellos do
    const locks = createLocks(20)
    const tabA = startTab({active: 'verdant', custom: [custom], removed: [], order: []})
    const tabB = startTab({active: null, custom: [custom], removed: [], order: []})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()
    // Both have said hello, nobody holds the lock yet
    expect(tabB.getSnapshot().context.active).toBeNull()

    await new Promise<void>((resolve) => setTimeout(resolve, 40))
    await tick()

    expect(selectStoredState(tabB.getSnapshot())).toEqual(selectStoredState(tabA.getSnapshot()))
    expect(tabB.getSnapshot().context.active).toBe('verdant')

    stopA()
    stopB()
  })

  it('keeps the newer of two answers, as every tab answers without a lock manager', async () => {
    const bus = createBus()
    const channelC = bus.open()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabC = startTab({...initialThemerState, custom: [custom]})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: bus.open,
      locks: undefined,
      schedule: immediately,
    })
    tabA.send({type: 'theme.pick', slug: 'verdant'})
    await tick()

    const stopC = syncThemer(tabC, {
      persist: () => {},
      openChannel: () => channelC,
      locks: undefined,
      schedule: immediately,
    })
    await tick()
    await tick()
    expect(tabC.getSnapshot().context.active).toBe('verdant')

    // A second answer to the same hello, from a tab that missed the pick
    const from = helloFrom(channelC.posted[0])
    bus.broadcast({
      type: 'state',
      state: {active: 'dew', custom: [custom], removed: [], order: []},
      revision: 0,
      from: 'stale',
      to: from,
    })
    await tick()

    expect(tabC.getSnapshot().context.active).toBe('verdant')
    // And nothing went around again on its account
    expect(channelC.posted).toEqual([{type: 'hello', from}])

    stopA()
    stopC()
  })

  it('does not let a late answer undo what the asking tab changed meanwhile', async () => {
    const bus = createBus()
    const locks = createLocks()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    // The second tab changes something before the holder has answered its hello
    const stopB = syncThemer(tabB, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    tabB.send({type: 'theme.pick', slug: 'custom-1'})
    await tick()
    await tick()

    expect(tabB.getSnapshot().context.active).toBe('custom-1')
    expect(tabA.getSnapshot().context.active).toBe('custom-1')

    stopA()
    stopB()
  })

  it('answers a tab that just started with the current state', async () => {
    const bus = createBus()
    const locks = createLocks()
    const tabA = startTab({active: 'custom-1', custom: [custom], removed: ['dew'], order: []})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    // Started from storage the holder had not written to yet
    const tabC = startTab()
    const stopC = syncThemer(tabC, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()
    await tick()

    expect(selectStoredState(tabC.getSnapshot())).toEqual(selectStoredState(tabA.getSnapshot()))
    expect(tabC.getSnapshot().hasTag('switching')).toBe(true)

    stopA()
    stopC()
  })

  it('ends up with one state when two tabs change at the same time', async () => {
    const bus = createBus()
    const locks = createLocks()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})
    const persistA = vi.fn<(snapshot: Snapshot<unknown>) => void>()

    const stopA = syncThemer(tabA, {
      persist: persistA,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    // Neither has heard of the other's change when it makes its own
    tabA.send({type: 'theme.pick', slug: 'verdant'})
    tabB.send({type: 'theme.pick', slug: 'custom-1'})
    await tick()
    await tick()

    const stateA = selectStoredState(tabA.getSnapshot())
    const stateB = selectStoredState(tabB.getSnapshot())

    expect(stateA).toEqual(stateB)
    expect(['verdant', 'custom-1']).toContain(stateA.active)
    // And that is what gets persisted
    expect(persistA.mock.lastCall?.[0]).toMatchObject({context: {active: stateA.active}})

    stopA()
    stopB()
  })

  it('has every tab persist for itself where there is no channel, lock manager or not', async () => {
    const locks = createLocks()
    const tabA = startTab()
    const tabB = startTab()
    const persistA = vi.fn()
    const persistB = vi.fn()

    const stopA = syncThemer(tabA, {
      persist: persistA,
      openChannel: () => null,
      locks,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: persistB,
      openChannel: () => null,
      locks,
      schedule: immediately,
    })
    await tick()

    tabB.send({type: 'theme.pick', slug: 'verdant'})

    expect(persistA).toHaveBeenCalledTimes(1)
    expect(persistB).toHaveBeenCalledTimes(2)
    expect(persistB.mock.lastCall?.[0]).toMatchObject({context: {active: 'verdant'}})

    stopA()
    stopB()
  })

  it('hands the persisting on as the holder goes away', async () => {
    const bus = createBus()
    const locks = createLocks()
    const tabA = startTab()
    const tabB = startTab()
    const persistA = vi.fn()
    const persistB = vi.fn()

    const stopA = syncThemer(tabA, {
      persist: persistA,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: persistB,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()
    expect(persistA).toHaveBeenCalledTimes(1)
    expect(persistB).not.toHaveBeenCalled()

    stopA()
    await tick()

    expect(persistB).toHaveBeenCalledTimes(1)

    tabB.send({type: 'theme.pick', slug: 'verdant'})
    await tick()
    expect(persistB).toHaveBeenCalledTimes(2)
    expect(persistA).toHaveBeenCalledTimes(1)

    stopB()
  })

  it('persists on its own where the browser has no locks or channel', () => {
    const tab = startTab()
    const persist = vi.fn()

    const stop = syncThemer(tab, {
      persist,
      openChannel: () => null,
      locks: undefined,
      schedule: immediately,
    })
    expect(persist).toHaveBeenCalledTimes(1)

    tab.send({type: 'theme.pick', slug: 'verdant'})
    expect(persist).toHaveBeenCalledTimes(2)

    stop()
  })

  it('writes once the browser is idle, and before it stops', () => {
    const tab = startTab()
    const persist = vi.fn()
    const scheduled: Array<() => void> = []
    const schedule = (callback: () => void) => {
      scheduled.push(callback)

      return () => {
        scheduled.splice(scheduled.indexOf(callback), 1)
      }
    }

    const stop = syncThemer(tab, {persist, openChannel: () => null, locks: undefined, schedule})
    expect(persist).toHaveBeenCalledTimes(1)

    // A run of changes is one write, once the browser gets to it
    tab.send({type: 'theme.pick', slug: 'verdant'})
    tab.send({type: 'theme.reorder', order: ['verdant', 'config']})
    expect(persist).toHaveBeenCalledTimes(1)
    expect(scheduled).toHaveLength(1)

    scheduled[0]()
    expect(persist).toHaveBeenCalledTimes(2)
    expect(persist.mock.lastCall?.[0]).toMatchObject({context: {active: 'verdant'}})

    // What is pending as the sync stops is written then
    tab.send({type: 'theme.pick', slug: 'dew'})
    expect(persist).toHaveBeenCalledTimes(2)
    stop()
    expect(persist).toHaveBeenCalledTimes(3)
    expect(persist.mock.lastCall?.[0]).toMatchObject({context: {active: 'dew'}})
  })

  it('orders the answers that follow one that only confirmed what it had', async () => {
    const bus = createBus()
    const channelC = bus.open()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabC = startTab({...initialThemerState, active: 'verdant', custom: [custom]})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: bus.open,
      locks: undefined,
      schedule: immediately,
    })
    // The first tab is one change ahead, at the state the newcomer loaded
    tabA.send({type: 'theme.pick', slug: 'verdant'})
    await tick()

    const stopC = syncThemer(tabC, {
      persist: () => {},
      openChannel: () => channelC,
      locks: undefined,
      schedule: immediately,
    })
    await tick()
    await tick()

    // The first answer changed nothing; a second, from a tab behind, must not either
    const from = helloFrom(channelC.posted[0])
    bus.broadcast({
      type: 'state',
      state: {active: 'dew', custom: [custom], removed: [], order: []},
      revision: 0,
      from: 'stale',
      to: from,
    })
    await tick()

    expect(tabC.getSnapshot().context.active).toBe('verdant')

    stopA()
    stopC()
  })

  it('hands the themes over as they are — a blank title, a deleted theme out of the order', async () => {
    const bus = createBus()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: bus.open,
      locks: undefined,
      schedule: immediately,
    })
    const stopB = syncThemer(tabB, {
      persist: () => {},
      openChannel: bus.open,
      locks: undefined,
      schedule: immediately,
    })
    await tick()

    tabA.send({type: 'theme.update', slug: 'custom-1', title: ''})
    tabA.send({type: 'theme.duplicate', slug: 'verdant'})
    const copy = tabA.getSnapshot().context.active!
    tabA.send({type: 'theme.reorder', order: [copy, 'custom-1', 'verdant']})
    tabA.send({type: 'theme.delete', slug: copy})
    await tick()

    expect(selectStoredState(tabB.getSnapshot())).toEqual(selectStoredState(tabA.getSnapshot()))
    expect(tabB.getSnapshot().context.custom[0].title).toBe('')
    expect(tabB.getSnapshot().context.order).toEqual(['custom-1', 'verdant'])

    stopA()
    stopB()
  })

  it('lets go of the lock while cached, and catches up before it persists again', async () => {
    const bus = createBus()
    const locks = createLocks()
    const pageA = createPage()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})
    const persistA = vi.fn()
    const persistB = vi.fn()

    const stopA = syncThemer(tabA, {
      persist: persistA,
      openChannel: pageA.open(bus.open),
      locks,
      schedule: immediately,
      page: pageA,
    })
    const stopB = syncThemer(tabB, {
      persist: persistB,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()
    expect(persistA).toHaveBeenCalledTimes(1)
    expect(persistB).not.toHaveBeenCalled()

    // Into the cache: the second tab takes over the persisting
    pageA.hide()
    await tick()
    expect(persistB).toHaveBeenCalledTimes(1)

    // Frozen, this tab hears nothing of the change
    tabB.send({type: 'theme.pick', slug: 'verdant'})
    await tick()
    expect(persistB).toHaveBeenCalledTimes(2)
    expect(tabA.getSnapshot().context.active).toBeNull()
    persistA.mockClear()

    // Back, behind the second tab in line: it asks what changed, and hears
    pageA.show()
    await tick()
    await tick()
    expect(tabA.getSnapshot().context.active).toBe('verdant')
    expect(persistA).not.toHaveBeenCalled()

    // The holder goes away: this tab persists again, with what it caught up on
    stopB()
    await tick()
    expect(persistA).toHaveBeenCalledTimes(1)
    expect(persistA.mock.calls[0][0]).toMatchObject({context: {active: 'verdant'}})

    stopA()
  })

  it('takes what changed while it was cached, whatever it changed before', async () => {
    const bus = createBus()
    const locks = createLocks()
    const pageA = createPage()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})
    const persistB = vi.fn()

    const stopA = syncThemer(tabA, {
      persist: () => {},
      openChannel: pageA.open(bus.open),
      locks,
      schedule: immediately,
      page: pageA,
    })
    const stopB = syncThemer(tabB, {
      persist: persistB,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    // This tab's change goes around before it is cached
    tabA.send({type: 'theme.pick', slug: 'dew'})
    await tick()
    expect(tabB.getSnapshot().context.active).toBe('dew')
    pageA.hide()
    await tick()

    // The other tab, persisting now, changes it again meanwhile
    tabB.send({type: 'theme.pick', slug: 'verdant'})
    await tick()
    persistB.mockClear()

    // Back, this tab hears of the change — the answer is not a late one to
    // its own change, to be answered with the frozen state as the newest
    pageA.show()
    await tick()
    await tick()
    expect(tabA.getSnapshot().context.active).toBe('verdant')
    expect(tabB.getSnapshot().context.active).toBe('verdant')
    expect(persistB).not.toHaveBeenCalled()

    stopA()
    stopB()
  })

  it('does not persist over the other tabs right after coming back from the cache', async () => {
    const bus = createBus()
    const locks = createLocks()
    const pageA = createPage()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})
    const persistA = vi.fn()

    const stopA = syncThemer(tabA, {
      persist: persistA,
      openChannel: pageA.open(bus.open),
      locks,
      schedule: immediately,
      page: pageA,
    })
    const stopB = syncThemer(tabB, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    pageA.hide()
    await tick()
    tabB.send({type: 'theme.pick', slug: 'verdant'})
    await tick()
    // The other tab leaves with the newer state persisted, before this one is back
    stopB()
    await tick()
    persistA.mockClear()

    pageA.show()
    await tick()
    await tick()

    // The lock is this tab's again, but what it has is not what to write —
    // and with nothing to read what was written from, it waits
    expect(persistA).not.toHaveBeenCalled()

    // Its own next change is
    tabA.send({type: 'theme.pick', slug: 'dew'})
    await tick()
    expect(persistA).toHaveBeenCalledTimes(1)

    stopA()
  })

  it('reads what the last tab wrote, back from the cache with no tab left to ask', async () => {
    const bus = createBus()
    const locks = createLocks()
    const store = createStore()
    const pageA = createPage()
    const tabA = startTab({...initialThemerState, custom: [custom]})
    const tabB = startTab({...initialThemerState, custom: [custom]})
    const persistA = vi.fn(store.persist)

    const stopA = syncThemer(tabA, {
      persist: persistA,
      restore: store.restore,
      openChannel: pageA.open(bus.open),
      locks,
      schedule: immediately,
      page: pageA,
    })
    const stopB = syncThemer(tabB, {
      persist: store.persist,
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()

    pageA.hide()
    await tick()
    tabB.send({type: 'theme.pick', slug: 'verdant'})
    await tick()
    // The other tab leaves with the newer state persisted, before this one is back
    stopB()
    await tick()
    persistA.mockClear()

    // No tab answers; the lock is this tab's, and what was written is its state
    pageA.show()
    await tick()
    await tick()
    expect(tabA.getSnapshot().context.active).toBe('verdant')
    expect(persistA).toHaveBeenCalledTimes(1)
    expect(persistA.mock.calls[0][0]).toMatchObject({context: {active: 'verdant'}})

    // Which is what a tab that starts now hears
    const tabC = startTab({...initialThemerState, custom: [custom]})
    const stopC = syncThemer(tabC, {
      persist: () => {},
      openChannel: bus.open,
      locks,
      schedule: immediately,
    })
    await tick()
    await tick()
    expect(tabC.getSnapshot().context.active).toBe('verdant')

    stopA()
    stopC()
  })

  it('ignores what it cannot use from the channel', async () => {
    const bus = createBus()
    const tab = startTab({...initialThemerState, custom: [custom]})
    const before = tab.getSnapshot()

    const stop = syncThemer(tab, {
      persist: () => {},
      openChannel: bus.open,
      locks: undefined,
      schedule: immediately,
    })
    bus.broadcast('garbage')
    bus.broadcast({type: 'nonsense'})
    bus.broadcast({type: 'state', state: 'nope', revision: 1, from: 'other'})
    bus.broadcast({type: 'state', state: {active: 'verdant'}})
    // Revisions that cannot order, and a recipient that is not a tab
    const state = {active: 'verdant', custom: [custom], removed: [], order: []}
    bus.broadcast({type: 'state', state, revision: -1, from: 'other'})
    bus.broadcast({type: 'state', state, revision: 1.5, from: 'other'})
    bus.broadcast({type: 'state', state, revision: Number.MAX_SAFE_INTEGER + 1, from: 'other'})
    bus.broadcast({type: 'state', state, revision: 1, from: 'other', to: 42})
    await tick()

    expect(selectStoredState(tab.getSnapshot())).toEqual(selectStoredState(before))

    // A state it can parse is taken, minus what it could not use of it
    bus.broadcast({
      type: 'state',
      state: {active: 'custom-9', custom: [{slug: 'custom-9'}, custom]},
      revision: 1,
      from: 'other',
    })
    await tick()

    expect(tab.getSnapshot().context.active).toBe('custom-9')
    expect(tab.getSnapshot().context.custom).toEqual([custom])

    stop()
  })
})
