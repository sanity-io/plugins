import {createContext, useContext} from 'react'

import type useAllItems from './useAllItems'
import type useTreeOperationsProvider from './useTreeOperationsProvider'

type ContextValue = ReturnType<typeof useTreeOperationsProvider> & {
  allItemsStatus: ReturnType<typeof useAllItems>['status']
}

function placeholder() {
  // no-op
}

export const TreeOperationsContext = createContext<ContextValue>({
  addItem: placeholder,
  duplicateItem: placeholder,
  removeItem: placeholder,
  handleMovedNode: placeholder,
  moveItemDown: placeholder,
  moveItemUp: placeholder,
  allItemsStatus: 'loading',
})

export default function useTreeOperations(): ContextValue {
  return useContext(TreeOperationsContext)
}
