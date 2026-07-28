import type {PickerIntent, PickerState} from './types'

export function pickerReducer(state: PickerState, intent: PickerIntent): PickerState {
  switch (intent.type) {
    case 'close':
    case 'select':
      return {mode: 'closed'}
    case 'navigate':
      if (state.mode === 'closed') return state
      return {
        ...state,
        highlightedIndex: state.highlightedIndex + intent.delta,
      }
    case 'open':
      if (state.mode !== 'closed') return state
      return {
        anchorBlockKey: intent.anchorBlockKey,
        highlightedIndex: 0,
        mode: intent.mode,
        query: intent.query,
      }
    case 'setHighlightedIndex':
      if (state.mode === 'closed') return state
      // Like `navigate`, the reducer does not clamp — the caller (which knows
      // the filtered list length) is responsible for staying in range.
      return {...state, highlightedIndex: intent.index}
    case 'updateQuery':
      if (state.mode === 'closed') return state
      return {...state, highlightedIndex: 0, query: intent.query}
    default: {
      // All intents are handled above; this arm satisfies consistent-return
      // while keeping the omission of a future variant a compile error.
      const unhandled: never = intent
      return unhandled
    }
  }
}
