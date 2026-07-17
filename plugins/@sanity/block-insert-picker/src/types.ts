import type {Editor} from '@portabletext/editor'
import type {ComponentType} from 'react'
import type {ArraySchemaType, ObjectSchemaType} from 'sanity'

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
  /** How the picker was opened; only present when `via` is `'picker'`. */
  mode?: PickerMode
  /** The filter query at select time; only present when `via` is `'picker'`. */
  query?: string
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
   * One-line explanation shown under the title. Curated metadata wins over
   * the member schema type's own `description` — curation is the more
   * specific intent (see resolveItemPresentation).
   */
  description?: string
  /**
   * Category label used to partition the menu into sections. Items without a
   * group render in a single unlabelled list (e.g. a curated `items` prop).
   */
  group?: string
  icon?: ComponentType
  keywords?: readonly string[]
  /** Short keyboard-style hint rendered at the row's trailing edge. */
  badge?: string
  /** Per-item override of the plugin-level `openOnInsert` default. */
  openOnInsert?: boolean
  action: PickerItemAction
}

/**
 * What selecting an item does. An open union: further named actions (for
 * example setting a text style) can be added without a breaking change.
 * `custom` items never insert anything themselves — the host's `onSelect`
 * runs with the editor after the picker closes and the typed query text
 * (slash mode) has been cleaned up.
 */
export type PickerItemAction =
  | {type: 'custom'; onSelect: (context: PickerActionContext) => void}
  | {type: 'insertBlock'; blockType: string}

/** Handed to a `custom` item's `onSelect` when the item is chosen. */
export interface PickerActionContext {
  editor: Editor
  closePicker: () => void
}

/**
 * Host-supplied curation for schema-derived picker items, keyed by member
 * type name (falling back to a name anywhere in the member's resolved type
 * chain, so `{type: 'image', name: 'photo'}` matches both `photo` and
 * `image` — the member name wins when both have entries): slash trigger,
 * alias keywords, section grouping, badge, visibility, per-item
 * open-on-insert, and description. Array position is the sort rank — members
 * without an entry still get picker items, appended after the ranked ones in
 * schema order.
 */
export type PickerItemMetadata = {
  type: string
  trigger?: string
  keywords?: readonly string[]
  group?: string
  description?: string
  /** Short keyboard-style hint rendered at the row's trailing edge. */
  badge?: string
  /** Removes the derived item from the picker without touching the schema. */
  hidden?: boolean
  /** Per-item override of the plugin-level `openOnInsert` default. */
  openOnInsert?: boolean
}

/**
 * The schema surroundings picker items derive from: the Portable Text array
 * type itself and its insertable (non-text-block) member types. Sourced from
 * Studio's member-schema context when available, or resolved from an
 * explicit `arrayTypeName` otherwise (see memberSchemaTypes.ts).
 */
export interface PickerItemsContext {
  schemaType: ArraySchemaType
  memberTypes: readonly ObjectSchemaType[]
}

/**
 * Programmatic escape hatch over the derived item list: reorder, remove,
 * relabel, or append items (including `custom`-action items) after schema
 * derivation, presets, and `items` metadata have been applied.
 */
export type PickerItemsResolver = (
  items: readonly PickerItem[],
  context: PickerItemsContext,
) => readonly PickerItem[]

export type PickerMode = 'shortcut' | 'slash'

export type PickerState =
  | {mode: 'closed'}
  | {
      mode: PickerMode
      query: string
      highlightedIndex: number
      anchorBlockKey: string
    }
