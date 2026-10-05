import {dequal} from 'dequal/lite'
import type {ActorRefFrom, Snapshot} from 'xstate'

import {selectStoredState, type themerMachine} from './machine'
import {parseThemerState} from './schemas'
import type {ThemerState} from './themes'

/** The channel every tab of the same origin shares — one Studio, one set of themes */
const CHANNEL_NAME = 'sanity-themer'

/**
 * The lock the one tab that persists holds for as long as it lives. The
 * other tabs queue for it, so when that tab goes away the next one in line
 * takes over the persisting — nothing is ever written from two tabs at once
 */
const LOCK_NAME = 'sanity-themer:persist'

/** How long a persist waits for the browser to be idle before it goes ahead anyway */
const PERSIST_TIMEOUT = 1_000

/**
 * What the tabs tell each other. Every change to the persisted state goes
 * around as `state`, with the `revision` it brings the state to — one more
 * than the last one the tab heard of — and the tab it is `from`: a tab takes
 * a state only when it is newer than the one it has, ties going to the
 * higher tab id, so that two tabs changing at once end up with the same
 * state rather than each other's. A tab that just started asks for the
 * current state with `hello`, answered with a `state` addressed `to` it,
 * which only it takes, and only while it has changed nothing of its own yet
 * — a change it made meanwhile goes around again instead, ahead of the
 * answer, so that a late answer never undoes it
 */
type SyncMessage =
  | {type: 'hello'; from: string}
  | {type: 'state'; state: ThemerState; revision: number; from: string; to?: string}

/** What the sync needs of a `BroadcastChannel` @internal */
export interface SyncChannel {
  /** Sends a message to the other tabs — not to this one */
  post(message: unknown): void
  /** Hears the other tabs' messages; returns what stops listening */
  listen(listener: (data: unknown) => void): () => void
  close(): void
}

/** What the sync needs of `navigator.locks` @internal */
export interface SyncLocks {
  request(
    name: string,
    options: {signal?: AbortSignal},
    callback: () => Promise<unknown>,
  ): Promise<unknown>
}

/**
 * What the sync does with the browser, each replaceable — so that it can run
 * under test, and so that it degrades where a browser lacks an API: without
 * a channel the tabs do not hear of each other, and without locks every tab
 * persists for itself
 *
 * @internal
 */
export interface ThemerSyncOptions {
  /** Persists the machine's snapshot — from the one tab that holds the lock */
  persist: (snapshot: Snapshot<unknown>) => void
  /**
   * Reads the themes the last persist wrote — what a tab back from the
   * back/forward cache catches up on when no other tab is left to tell it
   * what changed. Without it, such a tab persists nothing until it hears
   * from another tab or changes something of its own
   */
  restore?: () => ThemerState | undefined
  /** Opens the channel to the other tabs, or `null` where there is none */
  openChannel?: () => SyncChannel | null
  /** Elects the tab that persists, or `undefined` where there is no lock manager */
  locks?: SyncLocks | undefined
  /** Defers a persist to an idle moment; returns what cancels it */
  schedule?: (callback: () => void) => () => void
  /** The page whose `pagehide`/`pageshow` the sync follows — the window, or a stand-in */
  page?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
}

function openBroadcastChannel(): SyncChannel | null {
  if (typeof BroadcastChannel !== 'function') return null

  const channel = new BroadcastChannel(CHANNEL_NAME)

  return {
    // oxlint-disable-next-line require-post-message-target-origin -- a BroadcastChannel is same-origin by nature, its postMessage takes no target
    post: (message) => channel.postMessage(message),
    listen: (listener) => {
      const onMessage = (event: MessageEvent) => listener(event.data)

      channel.addEventListener('message', onMessage)

      return () => channel.removeEventListener('message', onMessage)
    },
    close: () => channel.close(),
  }
}

function browserLocks(): SyncLocks | undefined {
  // Web Locks need a secure context, where `navigator.locks` is undefined otherwise
  return typeof navigator !== 'undefined' && 'locks' in navigator ? navigator.locks : undefined
}

function scheduleIdle(callback: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(callback, {timeout: PERSIST_TIMEOUT})

    return () => cancelIdleCallback(id)
  }

  const id = setTimeout(callback, PERSIST_TIMEOUT)

  return () => clearTimeout(id)
}

function parseMessage(data: unknown): SyncMessage | null {
  if (!data || typeof data !== 'object') return null

  const type: unknown = Reflect.get(data, 'type')

  if (type === 'hello') {
    const from: unknown = Reflect.get(data, 'from')

    return typeof from === 'string' ? {type, from} : null
  }

  if (type === 'state') {
    const state = parseThemerState(Reflect.get(data, 'state'))
    const revision: unknown = Reflect.get(data, 'revision')
    const from: unknown = Reflect.get(data, 'from')
    const to: unknown = Reflect.get(data, 'to')

    // Revisions count up by one, so only a whole number that can keep doing so orders anything
    if (!state || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) {
      return null
    }
    if (typeof from !== 'string') return null
    // A recipient that is not a tab's id must not turn an answer into a broadcast
    if (to !== undefined && typeof to !== 'string') return null

    return {type, state, revision, from, ...(to === undefined ? {} : {to})}
  }

  return null
}

function tabId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

/**
 * Keeps the themes of every tab of the Studio the same, and persists them
 * from one tab only.
 *
 * Every tab runs its own machine, and what the machine persists — the
 * applied theme, the user's themes, what was removed and reordered — goes
 * around to the other tabs on a `BroadcastChannel` as it changes, where it
 * reaches their machines as a `themes.sync` event: the same themes
 * everywhere, with the flow each tab is in, the tool's open and split state
 * (the reducer's, in `ThemerProvider`) and the images of this session staying
 * the tab's own. A tab that starts asks the others for the current state,
 * in case what it read from storage was not written yet.
 *
 * Persisting is the business of one tab at a time: the one holding the Web
 * Lock, which it keeps for as long as it shows. The others queue for it, so
 * the next tab takes over as the holder goes away, and a tab that takes
 * over persists right away, in case the last one left with a write pending.
 * A page going into the back/forward cache lets go of the lock too — frozen,
 * it could neither persist nor answer — and queues for it again, asking the
 * others what changed, as it comes back; the lock coming to it before any
 * tab answered, no other tab is left to, and it reads what the last one
 * wrote instead. Writes happen when the browser is idle — a run of edits is
 * written once — and as the page hides, so that nothing pending is lost.
 *
 * Returns what stops the sync: it lets go of the lock, which hands the
 * persisting on, and closes the channel.
 *
 * @internal
 */
export function syncThemer(
  actorRef: ActorRefFrom<typeof themerMachine>,
  options: ThemerSyncOptions,
): () => void {
  const {
    persist,
    restore,
    openChannel = openBroadcastChannel,
    schedule = scheduleIdle,
    page = typeof window === 'undefined' ? undefined : window,
  } = options
  const channel = openChannel()
  // Without a channel the tabs cannot hear of each other's changes, so each
  // persists its own — a lock would only silence the tabs not holding it.
  // Given as `undefined` means no lock manager, not the browser's: Node has
  // one too these days
  const locks = channel ? ('locks' in options ? options.locks : browserLocks()) : undefined
  const id = tabId()
  /** Cancels the pending lock request, or lets a held lock go */
  let abort = new AbortController()
  let leader = false
  let cancelPersist: (() => void) | undefined
  /** Whether another tab's state is being sent into the machine, which is nothing to pass on */
  let applying = false
  /** The persisted state as the other tabs last heard it from this one, or this one from them */
  let shared = selectStoredState(actorRef.getSnapshot())
  /** The revision `shared` is at, and the tab whose change it was */
  let revision = 0
  let origin = id
  /** Whether this tab still has what it started with, so that an answer to its `hello` is welcome */
  let unchanged = true
  /** The tabs that said hello before this one held the lock, to answer once it does */
  const unanswered = new Set<string>()
  /**
   * Whether this tab is back from the back/forward cache without having heard
   * what changed meanwhile — not the state to persist over the others' yet
   */
  let restored = false

  const isNewer = (message: {revision: number; from: string}) =>
    message.revision > revision || (message.revision === revision && message.from > origin)

  const persistNow = () => {
    cancelPersist?.()
    cancelPersist = undefined
    persist(actorRef.getPersistedSnapshot())
  }
  const persistSoon = () => {
    cancelPersist?.()
    cancelPersist = schedule(persistNow)
  }
  const answer = (to: string) => {
    channel?.post({type: 'state', state: shared, revision, from: origin, to} satisfies SyncMessage)
  }
  /** Sends another source's state into the machine, as nothing to pass on */
  const apply = (state: ThemerState) => {
    shared = state
    applying = true
    try {
      actorRef.send({type: 'themes.sync', state})
    } finally {
      applying = false
    }
  }
  const becomeLeader = () => {
    // Back from the cache and the lock this tab's before any answer came: no
    // other tab is left to say what changed, so what the last one wrote did
    if (restored && restore) {
      const stored = restore()

      restored = false
      if (stored && !dequal(stored, shared)) apply(stored)
    }
    leader = true
    if (!restored) persistNow()
    // Tabs that started alongside this one asked before anyone held the lock
    for (const from of unanswered) answer(from)
    unanswered.clear()
  }

  const queueForLock = () => {
    if (!locks) {
      becomeLeader()

      return
    }

    const {signal} = abort

    locks
      .request(LOCK_NAME, {signal}, () => {
        becomeLeader()

        // Held until the sync stops or the page is cached, which hands the
        // lock to the next tab in line
        return new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => resolve(), {once: true})
        })
      })
      .catch(() => {
        // The request was cancelled before the lock was granted — nothing to let go of
      })
  }

  queueForLock()

  const subscription = actorRef.subscribe((snapshot) => {
    if (!applying) {
      const state = selectStoredState(snapshot)

      // Only changes to what is persisted concern the other tabs — the flow is this tab's
      if (!dequal(state, shared)) {
        shared = state
        unchanged = false
        restored = false
        revision += 1
        origin = id
        channel?.post({type: 'state', state, revision, from: id} satisfies SyncMessage)
      }
    }

    if (leader && !restored) persistSoon()
  })

  if (channel) {
    channel.listen((data) => {
      const message = parseMessage(data)

      if (!message) return

      if (message.type === 'hello') {
        // The tab that persists speaks for all, so that the newcomer hears one
        // answer — or hears it once a tab holds the lock
        if (leader) {
          answer(message.from)
        } else {
          unanswered.add(message.from)
        }

        return
      }

      if (message.to !== undefined) {
        if (message.to !== id) return

        // An answer is the holder's current state: whether it is ahead of
        // this tab or not, what this tab has is current once it is in
        restored = false

        if (!unchanged) {
          // Asked before this tab changed anything, answered after: the change
          // is the later one, and goes around again ahead of the answer
          if (origin === id) {
            revision = Math.max(revision, message.revision) + 1
            channel.post({type: 'state', state: shared, revision, from: id} satisfies SyncMessage)

            return
          }

          // Answered twice — without a lock manager every tab answers — the
          // answers are ordered like any other state
          if (!isNewer(message)) return
        }
      } else if (!isNewer(message)) {
        return
      }

      revision = message.revision
      origin = message.from
      // Even an answer that only confirms what this tab had settles what it
      // is at: the answers that may follow are ordered like any other state
      unchanged = false
      restored = false
      if (!dequal(message.state, shared)) apply(message.state)
    })
    channel.post({type: 'hello', from: id} satisfies SyncMessage)
  }

  const flush = () => {
    if (leader && cancelPersist) persistNow()
  }
  const hide = (event: Event) => {
    flush()

    // Into the back/forward cache: frozen, this tab can neither persist nor
    // answer, so the lock goes to the next tab in line until it shows again
    if ('persisted' in event && event.persisted === true && locks) {
      leader = false
      abort.abort()
    }
  }
  const show = (event: Event) => {
    if (!('persisted' in event) || event.persisted !== true || !locks) return

    // What changed meanwhile comes back as an answer, ordered like any other
    // state — until it does, this tab's state is not the one to persist. The
    // answer is as welcome as to a tab that just started: what this tab
    // changed before it was cached went around then, and the answer has it
    // — taken for a late reply to that change, it would be answered with the
    // frozen state as the newest
    restored = true
    unchanged = true
    abort = new AbortController()
    queueForLock()
    channel?.post({type: 'hello', from: id} satisfies SyncMessage)
  }

  page?.addEventListener('pagehide', hide)
  page?.addEventListener('pageshow', show)

  return () => {
    subscription.unsubscribe()
    page?.removeEventListener('pagehide', hide)
    page?.removeEventListener('pageshow', show)
    flush()
    abort.abort()
    channel?.close()
  }
}
