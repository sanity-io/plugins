import {describe, expect, it} from 'vitest'

import {resolveItemPresentation} from './resolveItemPresentation'
import type {PickerItem} from './types'

function FakeIcon() {
  return null
}

const callout: PickerItem = {
  action: {blockType: 'callout', type: 'insertBlock'},
  id: 'callout',
  title: '',
  trigger: '/callout',
}

describe('resolveItemPresentation', () => {
  it("uses the schema's title and icon for insertBlock items", () => {
    const schemaType = {icon: FakeIcon, name: 'callout', title: 'Callout'}
    expect(resolveItemPresentation(callout, schemaType)).toEqual({
      description: undefined,
      icon: FakeIcon,
      title: 'Callout',
    })
  })

  it("falls back to the schema's name when title is missing", () => {
    const schemaType = {icon: FakeIcon, name: 'callout'}
    expect(resolveItemPresentation(callout, schemaType)).toEqual({
      description: undefined,
      icon: FakeIcon,
      title: 'callout',
    })
  })

  it("returns the item's own title when no schemaType is provided", () => {
    const item: PickerItem = {...callout, title: 'Custom Title'}
    expect(resolveItemPresentation(item, undefined)).toEqual({
      description: undefined,
      icon: undefined,
      title: 'Custom Title',
    })
  })

  it('preserves an empty-string schema title rather than falling back to name', () => {
    const schemaType = {icon: FakeIcon, name: 'callout', title: ''}
    expect(resolveItemPresentation(callout, schemaType)).toEqual({
      description: undefined,
      icon: FakeIcon,
      title: '',
    })
  })

  it("prefers the schema type's description over the item's curated one", () => {
    const item: PickerItem = {...callout, description: 'Curated copy'}
    const schemaType = {
      description: 'Schema copy',
      name: 'callout',
      title: 'Callout',
    }
    expect(resolveItemPresentation(item, schemaType)).toMatchObject({
      description: 'Schema copy',
    })
  })

  it("falls back to the item's curated description when the schema type has none", () => {
    const item: PickerItem = {...callout, description: 'Curated copy'}
    const schemaType = {name: 'callout', title: 'Callout'}
    expect(resolveItemPresentation(item, schemaType)).toMatchObject({
      description: 'Curated copy',
    })
  })
})
