import {createContext, useContext} from 'react'

import type {getTreeOperations} from '../utils/getTreeOperations'
import type useAllItems from './useAllItems'

type ContextValue = ReturnType<typeof getTreeOperations> & {
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
  allItemsStatus: 'loading',
})

export default function useTreeOperations(): ContextValue {
  return useContext(TreeOperationsContext)
}
