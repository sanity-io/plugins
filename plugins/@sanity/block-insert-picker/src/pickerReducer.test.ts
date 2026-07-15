import {describe, expect, it} from 'vitest'

import {pickerReducer} from './pickerReducer'
import type {PickerState} from './types'

const closed: PickerState = {mode: 'closed'}
const openSlash: PickerState = {
  anchorBlockKey: 'abc123',
  highlightedIndex: 0,
  mode: 'slash',
  query: '/',
}

describe('pickerReducer', () => {
  it('opens from closed with the given mode and query', () => {
    expect(
      pickerReducer(closed, {
        anchorBlockKey: 'abc123',
        mode: 'slash',
        query: '/',
        type: 'open',
      }),
    ).toEqual(openSlash)
  })

  it('ignores open intent when already open', () => {
    const next = pickerReducer(openSlash, {
      anchorBlockKey: 'xyz999',
      mode: 'shortcut',
      query: '',
      type: 'open',
    })
    expect(next).toBe(openSlash)
  })

  it('updates query and resets highlightedIndex to 0', () => {
    const advanced: PickerState = {...openSlash, highlightedIndex: 3}
    expect(pickerReducer(advanced, {query: '/cal', type: 'updateQuery'})).toEqual({
      ...openSlash,
      highlightedIndex: 0,
      query: '/cal',
    })
  })

  it('ignores updateQuery when closed', () => {
    expect(pickerReducer(closed, {query: 'x', type: 'updateQuery'})).toBe(closed)
  })

  it('navigates forward and backward', () => {
    expect(pickerReducer(openSlash, {delta: 1, type: 'navigate'})).toMatchObject({
      highlightedIndex: 1,
    })
    const at2: PickerState = {...openSlash, highlightedIndex: 2}
    expect(pickerReducer(at2, {delta: -1, type: 'navigate'})).toMatchObject({
      highlightedIndex: 1,
    })
  })

  it('does not clamp on navigate — caller clamps against filtered length', () => {
    // The reducer is unaware of the item list; clamping happens at the call site
    // where the filtered list is known. This test pins down that contract.
    const at0: PickerState = {...openSlash, highlightedIndex: 0}
    expect(pickerReducer(at0, {delta: -1, type: 'navigate'})).toMatchObject({
      highlightedIndex: -1,
    })
  })

  it('sets highlighted index directly', () => {
    const at2: PickerState = {...openSlash, highlightedIndex: 2}
    expect(pickerReducer(at2, {index: 5, type: 'setHighlightedIndex'})).toMatchObject({
      highlightedIndex: 5,
    })
  })

  it('ignores setHighlightedIndex when closed', () => {
    expect(pickerReducer(closed, {index: 2, type: 'setHighlightedIndex'})).toBe(closed)
  })

  it('closes on close intent', () => {
    expect(pickerReducer(openSlash, {type: 'close'})).toEqual(closed)
  })

  it('closes on select intent — selection side-effect is handled by caller', () => {
    expect(pickerReducer(openSlash, {type: 'select'})).toEqual(closed)
  })
})
