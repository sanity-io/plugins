import type {ComponentType} from 'react'

/**
 * Emitted after a block lands in the document, whether via picker selection
 * or a markdown input rule. The public seam for hosts that need to react to
 * inserts (analytics, custom focus handling) without reaching into Studio
 * internals the way the built-in open-on-insert does (see openBlockOnInsert).
 */
export type PickerInsertEvent = {
  blockKey: string
  blockType: string
  via: 'inputRule' | 'picker'
}

export type PickerIntent =
  | {type: 'close'}
  | {type: 'navigate'; delta: -1 | 1}
  | {type: 'open'; mode: PickerMode; query: string; anchorBlockKey: string}
  | {type: 'select'}
  | {type: 'setHighlightedIndex'; index: number}
  | {type: 'updateQuery'; query: string}

export type PickerItem = {
  id: string
  trigger?: string
  title: string
  /**
   * One-line explanation shown under the title. Curated per block type;
   * BlockInsertPicker prefers the member schema type's own `description`
   * when it defines one.
   */
  description?: string
  /**
   * Category label used to partition the menu into sections. Items without a
   * group render in a single unlabelled list (e.g. a curated `items` prop).
   */
  group?: string
  icon?: ComponentType
  keywords?: readonly string[]
  action: PickerItemAction
}

export type PickerItemAction = {
  type: 'insertBlock'
  blockType: string
}

/**
 * Host-supplied curation for schema-derived picker items, keyed by member
 * type name: slash trigger, alias keywords, section grouping, and fallback
 * description. Array position is the sort rank — members without an entry
 * still get picker items, appended after the ranked ones in schema order.
 */
export type PickerItemMetadata = {
  type: string
  trigger?: string
  keywords?: readonly string[]
  group?: string
  description?: string
}

export type PickerMode = 'shortcut' | 'slash'

export type PickerState =
  | {mode: 'closed'}
  | {
      mode: PickerMode
      query: string
      highlightedIndex: number
      anchorBlockKey: string
    }
