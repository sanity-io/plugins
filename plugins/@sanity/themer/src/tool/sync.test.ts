import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createActor, type Snapshot} from 'xstate'

import {selectStoredState, themerMachine} from './machine'
import {type SyncChannel, type SyncLocks, syncThemer} from './sync'
import {type CustomTheme, initialThemerState, type ThemerState} from './themes'

const baseOptions = {light: {accent: '#123456'}}
const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}

/** Lets the fake channel deliver and the fake locks grant, both of which take a turn of the loop */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

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
function createLocks(): SyncLocks {
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
        setTimeout(() => grantNext(name), 0)
      })
    },
  }
}

function startTab(stored: ThemerState = initialThemerState) {
  return createActor(themerMachine, {input: {baseOptions, stored}}).start()
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

  it('answers the tabs that asked before the lock was granted', async () => {
    const bus = createBus()
    const grants: Array<() => void> = []
    // A lock manager that grants when the test says so, which is after both tabs have asked
    const locks: SyncLocks = {
      request: (_name, _options, callback) =>
        new Promise((resolve) => grants.push(() => resolve(callback()))),
    }
    const tabA = startTab({active: 'custom-1', custom: [custom], removed: ['dew'], order: []})
    const tabB = startTab()

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

    // Two tabs starting together both ask while no tab persists yet
    expect(selectStoredState(tabB.getSnapshot())).toEqual(initialThemerState)

    grants[0]?.()
    await tick()

    expect(selectStoredState(tabB.getSnapshot())).toEqual(selectStoredState(tabA.getSnapshot()))

    stopA()
    stopB()
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
