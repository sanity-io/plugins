import type {Editor, EditorSelection, EditorSnapshot} from '@portabletext/editor'
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
      const {anchorBlockKey, block, mode} = event
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
      return {
        anchor,
        block,
        cleanup: resolveQueryCleanup(event, snapshot),
        placement: mode === 'slash' ? ('auto' as const) : ('after' as const),
      }
    },
    on: 'custom.blockInsertPicker.insert',
  })
}

export function sendInsertPickerItem(editor: Editor, payload: InsertPickerItemPayload): void {
  editor.send({type: 'custom.blockInsertPicker.insert', ...payload})
}

type CleanupQueryPayload = Omit<InsertPickerItemPayload, 'block'>

/**
 * The query-cleanup half of the insert behavior on its own, for `custom`
 * picker actions that don't insert a block: the typed "/query" text still
 * leaves the document before the host's `onSelect` runs, under the same
 * only-if-unchanged guard as a real insert.
 */
export function createCleanupQueryBehavior() {
  return defineBehavior<
    CleanupQueryPayload,
    'custom.blockInsertPicker.cleanupQuery',
    NonNullable<EditorSelection>
  >({
    actions: [(_, cleanup) => [raise({at: cleanup, type: 'delete.text'})]],
    guard: ({event, snapshot}) => resolveQueryCleanup(event, snapshot) ?? false,
    on: 'custom.blockInsertPicker.cleanupQuery',
  })
}

export function sendCleanupQuery(editor: Editor, payload: CleanupQueryPayload): void {
  editor.send({type: 'custom.blockInsertPicker.cleanupQuery', ...payload})
}

/**
 * The selection spanning the typed "/query" text in the anchor block, when it
 * is safe to delete. Only slash mode leaves query text in the document, and
 * only when the anchor block still starts with the typed query; if it changed
 * underneath us (collaborator edit, uncaptured caret movement) the action is
 * still the user's intent, but nothing may be deleted.
 */
function resolveQueryCleanup(
  event: {anchorBlockKey: string; mode: PickerMode; query: string},
  snapshot: EditorSnapshot,
): EditorSelection {
  const {anchorBlockKey, mode, query} = event
  if (mode !== 'slash' || query.length === 0) return null
  const anchorBlock = snapshot.context.value.find((candidate) => candidate._key === anchorBlockKey)
  if (
    !anchorBlock ||
    !isTextBlock({schema: snapshot.context.schema}, anchorBlock) ||
    !getTextBlockText(anchorBlock).startsWith(query)
  ) {
    return null
  }
  return blockOffsetsToSelection({
    offsets: {
      anchor: {offset: 0, path: [{_key: anchorBlockKey}]},
      focus: {offset: query.length, path: [{_key: anchorBlockKey}]},
    },
    snapshot,
  })
}
