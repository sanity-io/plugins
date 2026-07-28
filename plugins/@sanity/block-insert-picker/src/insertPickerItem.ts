import type {Editor} from '@portabletext/editor'

import {sendInsertPickerItem} from './insertBehavior'
import type {PickerMode} from './types'

type InsertContext = {
  /** The `_type` of the block to insert — an `insertBlock` action's target. */
  blockType: string
  mode: PickerMode
  editor: Editor
  anchorBlockKey: string
  query: string
  keyGenerator: () => string
  initialValue?: Record<string, unknown>
  onInsertedKey?: (key: string) => void
}

export function insertPickerItem(ctx: InsertContext): void {
  const blockKey = ctx.keyGenerator()
  // One custom event; the registered insert behavior performs the query
  // cleanup and the insertion in a single action set (single undo step).
  sendInsertPickerItem(ctx.editor, {
    anchorBlockKey: ctx.anchorBlockKey,
    block: {
      // Spread the resolved initial value first so the generated `_key` and
      // the target `_type` always win: Sanity's initial-value resolver sets
      // `_type` on object values, and a schema's initialValue could carry
      // stray meta keys. In this flow the resolved `_type` matches
      // `ctx.blockType` by construction, but ordering it last keeps the
      // insert correct even when that assumption doesn't hold.
      ...ctx.initialValue,
      _key: blockKey,
      _type: ctx.blockType,
    },
    mode: ctx.mode,
    query: ctx.query,
  })
  ctx.onInsertedKey?.(blockKey)
}
