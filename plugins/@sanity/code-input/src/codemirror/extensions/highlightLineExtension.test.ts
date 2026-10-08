import {type ChangeSpec, EditorState} from '@codemirror/state'
import {describe, expect, test} from 'vitest'

import {highlightState} from './highlightLineExtension'

function createState(doc: string, highlight: number[]): EditorState {
  return EditorState.fromJSON(
    {doc, selection: {main: 0, ranges: [{anchor: 0, head: 0}]}, highlight},
    {},
    highlightState,
  )
}

function getHighlights(state: EditorState): {line: number; text: string}[] {
  const lines: number[] = state.toJSON(highlightState).highlight
  return lines.map((line) => ({line, text: state.doc.line(line).text}))
}

// Line 3 ("three") spans offsets 8-13, its line break before is at 7 and after is at 13
const doc = 'one\ntwo\nthree\nfour'

describe('mapping highlighted lines through edits', () => {
  test.each<{name: string; changes: ChangeSpec; expected: {line: number; text: string}[]}>([
    {
      name: 'inserting a line break at the end of the line above',
      changes: {from: 7, insert: '\n'},
      expected: [{line: 4, text: 'three'}],
    },
    {
      name: 'inserting a line break at the start of the highlighted line',
      changes: {from: 8, insert: '\n'},
      expected: [{line: 4, text: 'three'}],
    },
    {
      name: 'pasting lines above',
      changes: {from: 0, insert: 'a\nb\n'},
      expected: [{line: 5, text: 'three'}],
    },
    {
      name: 'pasting lines at the start of the highlighted line',
      changes: {from: 8, insert: 'a\nb\n'},
      expected: [{line: 5, text: 'three'}],
    },
    {
      name: 'deleting the line above together with the line break before it',
      changes: {from: 3, to: 7},
      expected: [{line: 2, text: 'three'}],
    },
    {
      name: 'deleting the line above together with the line break after it',
      changes: {from: 4, to: 8},
      expected: [{line: 2, text: 'three'}],
    },
    {
      name: 'joining the highlighted line with the line above',
      changes: {from: 7, to: 8},
      expected: [{line: 2, text: 'twothree'}],
    },
    {
      name: 'typing at the start of the highlighted line',
      changes: {from: 8, insert: 'x'},
      expected: [{line: 3, text: 'xthree'}],
    },
    {
      name: 'deleting the first character of the highlighted line',
      changes: {from: 8, to: 9},
      expected: [{line: 3, text: 'hree'}],
    },
    {
      name: 'clearing the content of the highlighted line',
      changes: {from: 8, to: 13},
      expected: [{line: 3, text: ''}],
    },
    {
      name: 'deleting the highlighted line together with the line break before it',
      changes: {from: 7, to: 13},
      expected: [],
    },
    {
      name: 'deleting the highlighted line together with the line break after it',
      changes: {from: 8, to: 14},
      expected: [],
    },
    {
      name: 'replacing the whole document',
      changes: {from: 0, to: doc.length, insert: 'new'},
      expected: [],
    },
  ])('$name', ({changes, expected}) => {
    const state = createState(doc, [3])
    expect(getHighlights(state)).toEqual([{line: 3, text: 'three'}])

    expect(getHighlights(state.update({changes}).state)).toEqual(expected)
  })

  test('merges highlights that end up on the same line', () => {
    const state = createState(doc, [2, 3]).update({changes: {from: 7, to: 8}}).state

    expect(getHighlights(state)).toEqual([{line: 2, text: 'twothree'}])
  })

  test('removes the highlight of an empty line when the line is deleted', () => {
    const state = createState('one\n\nthree', [2]).update({changes: {from: 3, to: 4}}).state

    expect(getHighlights(state)).toEqual([])
  })
})
