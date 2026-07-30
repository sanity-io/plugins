import {defineBehavior, effect, forward} from '@portabletext/editor/behaviors'
import type {BehaviorEvent, BehaviorGuard} from '@portabletext/editor/behaviors'
import {
  getBlockTextBefore,
  getFirstBlock,
  getFocusBlock,
  getFocusTextBlock,
  isSelectionCollapsed,
} from '@portabletext/editor/selectors'

import type {PickerIntent, PickerState} from './types'

type GuardResult = {
  // true = block the native/default editor handling; false = allow it to proceed
  blockEvent: boolean
  intent: PickerIntent
}

type PickerBehaviorRefs = {
  onIntent: (intent: PickerIntent) => void
  getState: () => PickerState
  /**
   * Whether Cmd/Ctrl+/ may open the picker. Read per keystroke (not captured
   * at registration) so the host toggling `shortcut` doesn't force a
   * re-registration, which would re-sort the editor's behavior chain.
   */
  isShortcutEnabled: () => boolean
}

export function createPickerBehavior({getState, isShortcutEnabled, onIntent}: PickerBehaviorRefs) {
  const guard: BehaviorGuard<BehaviorEvent, GuardResult> = ({event, snapshot}) => {
    const state = getState()

    // Picker is closed — only the two open triggers can fire.
    if (state.mode === 'closed') {
      if (event.type === 'insert.text' && event.text === '/') {
        const focus = getFocusTextBlock(snapshot)
        if (!focus || !isSelectionCollapsed(snapshot) || getBlockTextBefore(snapshot) !== '') {
          return false
        }
        return {
          blockEvent: false,
          intent: {
            anchorBlockKey: focus.node._key,
            mode: 'slash',
            query: '/',
            type: 'open',
          } satisfies PickerIntent,
        }
      }
      if (
        event.type === 'keyboard.keydown' &&
        event.originEvent.key === '/' &&
        (event.originEvent.metaKey || event.originEvent.ctrlKey) &&
        isShortcutEnabled()
      ) {
        // For the shortcut mode, anchor to the focused block whether it is a
        // text block or a block object (image, callout); fall back to the
        // first block only when there is no selection at all (e.g. when
        // triggered via a toolbar button before the editor is DOM-focused).
        const focus = getFocusBlock(snapshot)
        const fallback = getFirstBlock(snapshot)
        const anchorBlock = focus ?? fallback
        if (!anchorBlock) return false
        return {
          blockEvent: true,
          intent: {
            anchorBlockKey: anchorBlock.node._key,
            mode: 'shortcut',
            query: '',
            type: 'open',
          } satisfies PickerIntent,
        }
      }
      return false
    }

    // Picker is open — capture editing/navigation events.
    if (event.type === 'insert.text') {
      if (state.mode === 'slash') {
        if (event.text === ' ') {
          // Space while open: close picker, let the space insert proceed.
          return {blockEvent: false, intent: {type: 'close'}}
        }
        // Character typed while in slash mode: update query; let the editor
        // insert the character into the document as well.
        return {
          blockEvent: false,
          intent: {query: state.query + event.text, type: 'updateQuery'},
        }
      }
      // Shortcut-mode type-to-filter: the query is picker-only state that
      // never entered the document, so capture the character (spaces
      // included — titles contain them) and block the insertion.
      return {
        blockEvent: true,
        intent: {query: state.query + event.text, type: 'updateQuery'},
      }
    }

    if (event.type === 'delete.backward') {
      if (state.mode === 'shortcut') {
        // Backspace edits the picker-only query, never the document.
        if (state.query.length === 0) {
          return {blockEvent: true, intent: {type: 'close'}}
        }
        return {
          blockEvent: true,
          intent: {
            // Word/line deletes clear the whole query rather than desyncing.
            query: event.unit === 'character' ? state.query.slice(0, -1) : '',
            type: 'updateQuery',
          },
        }
      }
      // Slash mode: the deletion proceeds in the document, so shrink the
      // query in sync. Deleting the opening "/" itself closes, and word/line
      // deletes can outrun the query — close and let them proceed.
      if (event.unit === 'character' && state.query.length > 1) {
        return {
          blockEvent: false,
          intent: {query: state.query.slice(0, -1), type: 'updateQuery'},
        }
      }
      return {blockEvent: false, intent: {type: 'close'}}
    }

    if (event.type === 'delete.forward') {
      // Forward delete edits content ahead of the caret, not the query;
      // close and let the deletion proceed in the editor normally.
      return {blockEvent: false, intent: {type: 'close'}}
    }

    if (event.type === 'keyboard.keydown') {
      const key = event.originEvent.key
      if (key === 'ArrowDown') {
        return {blockEvent: true, intent: {delta: 1, type: 'navigate'}}
      }
      if (key === 'ArrowUp') {
        return {blockEvent: true, intent: {delta: -1, type: 'navigate'}}
      }
      if (key === 'Enter') {
        return {blockEvent: true, intent: {type: 'select'}}
      }
      if (key === 'Escape') {
        return {blockEvent: true, intent: {type: 'close'}}
      }
      if (
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'Home' ||
        key === 'End' ||
        key === 'PageUp' ||
        key === 'PageDown'
      ) {
        // The caret is moving off the typed query; close and let the caret
        // move normally so the picker's query can't desync from the document.
        return {blockEvent: false, intent: {type: 'close'}}
      }
    }

    return false
  }

  return defineBehavior({
    actions: [
      (payload, guardResponse) => {
        // Actions only run when the guard returned a value, so guardResponse
        // is the GuardResult the guard produced.
        const {blockEvent, intent} = guardResponse
        const sideEffect = effect(() => onIntent(intent))
        if (blockEvent) {
          // Stopping propagation: only run the side effect, no forward.
          return [sideEffect]
        }
        // Non-blocking: run side effect and forward the original event so
        // PTE's default handling still executes.
        return [sideEffect, forward(payload.event)]
      },
    ],
    guard,
    on: '*',
  })
}
