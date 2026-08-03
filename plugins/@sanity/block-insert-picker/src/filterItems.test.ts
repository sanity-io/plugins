import {describe, expect, it} from 'vitest'

import {filterPickerItems} from './filterItems'
import type {PickerItem} from './types'

const items: readonly PickerItem[] = [
  {
    action: {blockType: 'callout', type: 'insertBlock'},
    id: 'callout',
    title: 'Callout',
    trigger: '/callout',
  },
  {
    action: {blockType: 'codeBlock', type: 'insertBlock'},
    id: 'code',
    title: 'Code block',
    trigger: '/code',
  },
  {
    action: {blockType: 'callToAction', type: 'insertBlock'},
    description: 'Prominent call-to-action card',
    id: 'cta',
    keywords: ['button'],
    title: 'Call to action',
    trigger: '/cta',
  },
]

describe('filterPickerItems', () => {
  it('returns all items for empty query', () => {
    expect(filterPickerItems(items, '')).toEqual(items)
  })

  it('returns all items for the lone slash', () => {
    expect(filterPickerItems(items, '/')).toEqual(items)
  })

  it('filters by trigger prefix', () => {
    expect(filterPickerItems(items, '/c')).toEqual(items)
    // "/cal" hits the callout trigger AND "Call to action" via title.
    expect(filterPickerItems(items, '/cal')).toEqual([items[0], items[2]])
    expect(filterPickerItems(items, '/cta')).toEqual([items[2]])
    expect(filterPickerItems(items, '/callo')).toEqual([items[0]])
  })

  it('matches trigger prefix case-insensitively', () => {
    expect(filterPickerItems(items, '/Callo')).toEqual([items[0]])
    expect(filterPickerItems(items, '/CTA')).toEqual([items[2]])
  })

  it('matches trigger prefix for bare shortcut-mode queries', () => {
    // Shortcut-mode queries carry no leading "/"; "cta" matches neither the
    // title "Call to action" nor the keywords, so only the trigger can hit.
    expect(filterPickerItems(items, 'cta')).toEqual([items[2]])
    expect(filterPickerItems(items, 'CTA')).toEqual([items[2]])
  })

  it('matches titles with the leading slash stripped from the query', () => {
    // Slash-mode queries always start with "/", which titles never contain.
    expect(filterPickerItems(items, '/block')).toEqual([items[1]])
    expect(filterPickerItems(items, 'block')).toEqual([items[1]])
  })

  it('matches keywords with the leading slash stripped from the query', () => {
    expect(filterPickerItems(items, '/button')).toEqual([items[2]])
    expect(filterPickerItems(items, 'button')).toEqual([items[2]])
  })

  it('matches the description text', () => {
    // "prominent" only appears in the cta item's description.
    expect(filterPickerItems(items, 'prominent')).toEqual([items[2]])
    expect(filterPickerItems(items, '/prominent')).toEqual([items[2]])
  })

  it('is case-insensitive on title and keywords', () => {
    expect(filterPickerItems(items, '/BLOCK')).toEqual([items[1]])
    expect(filterPickerItems(items, 'Button')).toEqual([items[2]])
  })

  it('returns empty for a query that matches nothing', () => {
    expect(filterPickerItems(items, '/zzz')).toEqual([])
    expect(filterPickerItems(items, 'zzz')).toEqual([])
  })
})
