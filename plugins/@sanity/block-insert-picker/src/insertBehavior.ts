import type {Editor, EditorSelection} from '@portabletext/editor'
import {defineBehavior, raise} from '@portabletext/editor/behaviors'
import {blockOffsetsToSelection, getTextBlockText, isTextBlock} from '@portabletext/editor/utils'

import type {PickerMode} from './types'

type InsertGuardResult = {
  anchor: EditorSelection
  block: InsertPickerItemPayload['block']
  cleanup: EditorSelection
  placement: 'after' | 'auto'
}

type InsertPickerItemPayload = {
  anchorBlockKey: string
  block: {_key: string; _type: string} & Record<string, unknown>
  mode: PickerMode
  query: string
}

/**
 * Performs the picker insertion as a single behavior action set so the whole
 * operation is one undo step, and cleans up the typed "/query" text with
 * delete.text over exactly that range (never delete.block) so text that
 * already existed in the anchor block can't be destroyed: the caret can sit
 * at offset 0 of a populated block and still open the picker.
 */
export function createInsertBehavior() {
  return defineBehavior<
    InsertPickerItemPayload,
    'custom.blockInsertPicker.insert',
    InsertGuardResult
  >({
    actions: [
      (_, {anchor, block, cleanup, placement}) => [
        ...(cleanup ? [raise({at: cleanup, type: 'delete.text'})] : []),
        raise({
          block,
          placement,
          select: 'start',
          type: 'insert.block',
          // Pin the insert to the anchor block: the live selection may have
          // moved (e.g. input arriving during the select-time initial-value
          // await) and placement resolves relative to `at` when provided.
          ...(anchor ? {at: anchor} : {}),
        }),
      ],
    ],
    guard: ({event, snapshot}) => {
      const {anchorBlockKey, block, mode, query} = event
      const anchorBlockExists = snapshot.context.value.some(
        (candidate) => candidate._key === anchorBlockKey,
      )
      const anchor = anchorBlockExists
        ? blockOffsetsToSelection({
            offsets: {
              anchor: {offset: 0, path: [{_key: anchorBlockKey}]},
              focus: {offset: 0, path: [{_key: anchorBlockKey}]},
            },
            snapshot,
          })
        : null
      let cleanup: EditorSelection = null
      if (mode === 'slash' && query.length > 0) {
        const anchorBlock = snapshot.context.value.find(
          (candidate) => candidate._key === anchorBlockKey,
        )
        // Only clean up when the anchor block still starts with the typed
        // query; if it changed underneath us (collaborator edit, uncaptured
        // caret movement) inserting is still the user's intent, but nothing
        // may be deleted.
        if (
          anchorBlock &&
          isTextBlock({schema: snapshot.context.schema}, anchorBlock) &&
          getTextBlockText(anchorBlock).startsWith(query)
        ) {
          cleanup = blockOffsetsToSelection({
            offsets: {
              anchor: {offset: 0, path: [{_key: anchorBlockKey}]},
              focus: {offset: query.length, path: [{_key: anchorBlockKey}]},
            },
            snapshot,
          })
        }
      }
      return {
        anchor,
        block,
        cleanup,
        placement: mode === 'slash' ? ('auto' as const) : ('after' as const),
      }
    },
    on: 'custom.blockInsertPicker.insert',
  })
}

export function sendInsertPickerItem(editor: Editor, payload: InsertPickerItemPayload): void {
  editor.send({type: 'custom.blockInsertPicker.insert', ...payload})
}
