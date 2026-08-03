import {describe, expect, it} from 'vitest'

import {flattenSections, groupPickerItems} from './groupItems'
import type {PickerItem} from './types'

function item(id: string, group?: string): PickerItem {
  return {
    action: {blockType: id, type: 'insertBlock'},
    group,
    id,
    title: id,
  }
}

describe('groupPickerItems', () => {
  it('returns a single null-group section when no item carries a group', () => {
    const items = [item('a'), item('b')]
    expect(groupPickerItems(items)).toEqual([{group: null, items}])
  })

  it('orders sections by first appearance in the input', () => {
    // Input order mimics the census-ranked flat list: the group holding the
    // first (most-used) item leads.
    const sections = groupPickerItems([
      item('code', 'Code & API'),
      item('callout', 'Callouts & cards'),
      item('image', 'Media'),
      item('props', 'Code & API'),
    ])
    expect(sections.map((s) => s.group)).toEqual(['Code & API', 'Callouts & cards', 'Media'])
  })

  it('preserves input order within a section', () => {
    const sections = groupPickerItems([
      item('code', 'Code & API'),
      item('callout', 'Callouts & cards'),
      item('props', 'Code & API'),
      item('methodTable', 'Code & API'),
    ])
    const codeSection = sections.find((s) => s.group === 'Code & API')
    expect(codeSection?.items.map((i) => i.id)).toEqual(['code', 'props', 'methodTable'])
  })

  it('collects grouped and ungrouped items into distinct sections', () => {
    const sections = groupPickerItems([item('code', 'Code & API'), item('mystery')])
    expect(sections.map((s) => s.group)).toEqual(['Code & API', null])
  })
})

describe('flattenSections', () => {
  it('is a no-op reordering for a single ungrouped section', () => {
    const items = [item('a'), item('b')]
    expect(flattenSections(groupPickerItems(items))).toEqual(items)
  })

  it('returns items in grouped display order, not raw input order', () => {
    const input = [
      item('code', 'Code & API'),
      item('callout', 'Callouts & cards'),
      item('props', 'Code & API'),
    ]
    // "props" is pulled up next to "code" because they share a section, even
    // though "callout" precedes it in the input.
    expect(flattenSections(groupPickerItems(input)).map((i) => i.id)).toEqual([
      'code',
      'props',
      'callout',
    ])
  })
})
