import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {describe, expect, it} from 'vitest'

import {resolveItemPresentation} from './resolveItemPresentation'
import type {PickerItem} from './types'

function FakeIcon() {
  return null
}

function ParentIcon() {
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

  it("falls back to the capitalized name when the schema's title is missing", () => {
    const schemaType = {icon: FakeIcon, name: 'codeBlock'}
    // Matches core's upperFirst: first character only, rest untouched.
    expect(resolveItemPresentation(callout, schemaType)).toMatchObject({title: 'CodeBlock'})
  })

  it("returns the item's own title when no schemaType is provided", () => {
    const item: PickerItem = {...callout, title: 'Custom Title'}
    expect(resolveItemPresentation(item, undefined)).toEqual({
      description: undefined,
      icon: BlockElementIcon,
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

  it("prefers the item's curated description over the schema type's", () => {
    // Curation is the more specific intent: `items` metadata is written for
    // this picker, the schema description for the editing form.
    const item: PickerItem = {...callout, description: 'Curated copy'}
    const schemaType = {
      description: 'Schema copy',
      name: 'callout',
      title: 'Callout',
    }
    expect(resolveItemPresentation(item, schemaType)).toMatchObject({
      description: 'Curated copy',
    })
  })

  it("falls back to the schema type's description when no curated one exists", () => {
    const schemaType = {
      description: 'Schema copy',
      name: 'callout',
      title: 'Callout',
    }
    expect(resolveItemPresentation(callout, schemaType)).toMatchObject({
      description: 'Schema copy',
    })
  })

  it("walks the icon fallback chain: member, parent type, then Studio's block icon", () => {
    // The same chain Studio's built-in insert menu resolves icons with.
    expect(
      resolveItemPresentation(callout, {name: 'photo', type: {icon: ParentIcon, name: 'image'}}),
    ).toMatchObject({icon: ParentIcon})
    expect(resolveItemPresentation(callout, {name: 'callout'})).toMatchObject({
      icon: BlockElementIcon,
    })
  })

  it('reads a reference target icon before the generic fallback', () => {
    expect(
      resolveItemPresentation(callout, {name: 'authorRef', to: [{icon: FakeIcon}]}),
    ).toMatchObject({icon: FakeIcon})
  })
})
