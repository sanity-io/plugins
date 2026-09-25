// @vitest-environment node
import {afterEach, describe, expect, it, vi} from 'vitest'
import {createActor, createMachine} from 'xstate'

import {debugMachine, withBadConnection} from './debugMachine'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function startDebugActor() {
  return createActor(debugMachine, {systemId: 'debug'}).start()
}

describe(debugMachine.id, () => {
  it('toggles the debug panel and the simulated bad connection', () => {
    const actor = startDebugActor()

    actor.send({type: 'debug.toggle'})
    actor.send({type: 'debug.badConnection.set', badConnection: true})

    expect(actor.getSnapshot().context).toEqual({badConnection: true, enabled: true})
  })
})

describe('withBadConnection', () => {
  it('sends requests right away when the connection is fine', async () => {
    const request = vi.fn(() => Promise.resolve('ok'))

    const withoutDebugActor = withBadConnection(
      createActor(createMachine({})).system,
      undefined,
      request,
    )
    const withDebugActor = withBadConnection(startDebugActor().system, undefined, request)

    expect(request).toHaveBeenCalledTimes(2)
    await expect(withoutDebugActor).resolves.toBe('ok')
    await expect(withDebugActor).resolves.toBe('ok')
  })

  it('delays requests over a bad connection, and fails half of them', async () => {
    vi.useFakeTimers()
    const actor = startDebugActor()
    actor.send({type: 'debug.badConnection.set', badConnection: true})
    const request = vi.fn(() => Promise.resolve('ok'))
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.4)

    const succeeding = withBadConnection(actor.system, undefined, request)
    await vi.advanceTimersByTimeAsync(2999)
    expect(request).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await expect(succeeding).resolves.toBe('ok')

    random.mockReturnValue(0.6)
    const failing = withBadConnection(actor.system, undefined, request)
    const assertion = expect(failing).rejects.toMatchObject({
      message: 'Test error',
      statusCode: 500,
    })
    await vi.advanceTimersByTimeAsync(3000)
    await assertion
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('abandons delayed requests once aborted', async () => {
    const actor = startDebugActor()
    actor.send({type: 'debug.badConnection.set', badConnection: true})
    const controller = new AbortController()
    const request = vi.fn(() => Promise.resolve('ok'))

    const pending = withBadConnection(actor.system, controller.signal, request)
    controller.abort(new Error('Stopped'))

    await expect(pending).rejects.toThrow('Stopped')
    expect(request).not.toHaveBeenCalled()
  })
})
