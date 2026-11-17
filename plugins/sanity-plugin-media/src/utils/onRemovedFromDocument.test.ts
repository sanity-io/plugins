// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest'

import {disposeOnUnmount, onRemovedFromDocument} from './onRemovedFromDocument'

const flushMutations = () => new Promise<void>((resolve) => queueMicrotask(resolve))

describe('disposeOnUnmount', () => {
  it('disposes right away when the element is already out of the document', () => {
    const element = document.createElement('span')
    const dispose = vi.fn()
    const onHide = vi.fn()
    disposeOnUnmount(element, dispose, onHide)
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(onHide).not.toHaveBeenCalled()

    dispose.mockClear()
    disposeOnUnmount(null, dispose)
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('treats a connected element as hidden and disposes once it is removed', async () => {
    const element = document.body.appendChild(document.createElement('span'))
    const dispose = vi.fn()
    const onHide = vi.fn()
    disposeOnUnmount(element, dispose, onHide)
    expect(onHide).toHaveBeenCalledTimes(1)
    expect(dispose).not.toHaveBeenCalled()

    element.remove()
    await flushMutations()
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('stops waiting when the returned function is called', async () => {
    const element = document.body.appendChild(document.createElement('span'))
    const dispose = vi.fn()
    const stop = disposeOnUnmount(element, dispose)

    stop()
    element.remove()
    await flushMutations()
    expect(dispose).not.toHaveBeenCalled()
  })
})

describe('onRemovedFromDocument', () => {
  it('calls back once the element leaves the document', async () => {
    const element = document.body.appendChild(document.createElement('span'))
    const callback = vi.fn()
    onRemovedFromDocument(element, callback)

    document.body.appendChild(document.createElement('div'))
    await flushMutations()
    expect(callback).not.toHaveBeenCalled()

    element.remove()
    await flushMutations()
    expect(callback).toHaveBeenCalledTimes(1)

    document.body.appendChild(element)
    element.remove()
    await flushMutations()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('calls every callback registered for the same element', async () => {
    const element = document.body.appendChild(document.createElement('span'))
    const first = vi.fn()
    const second = vi.fn()
    onRemovedFromDocument(element, first)
    onRemovedFromDocument(element, second)

    element.remove()
    await flushMutations()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('stops watching', async () => {
    const element = document.body.appendChild(document.createElement('span'))
    const callback = vi.fn()
    const stop = onRemovedFromDocument(element, callback)

    stop()
    element.remove()
    await flushMutations()
    expect(callback).not.toHaveBeenCalled()
  })
})
