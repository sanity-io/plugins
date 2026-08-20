import {configureStore, type EnhancedStore, type UnknownAction} from '@reduxjs/toolkit'
import type {SanityClient} from '@sanity/client'
import type {Epic} from 'redux-observable'
import {createEpicMiddleware} from 'redux-observable'

import {rootReducer} from '../../modules'
import type {RootReducerState} from '../../modules/types'
import {createTestRootState} from './rootState'

export function createEpicTestStore(
  epic: Epic<UnknownAction, UnknownAction, RootReducerState, {client: SanityClient}>,
  mockClient: SanityClient,
  preloaded?: Partial<RootReducerState>,
): EnhancedStore<RootReducerState> {
  const epicMiddleware = createEpicMiddleware<UnknownAction, UnknownAction, RootReducerState>({
    dependencies: {client: mockClient},
  })

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({serializableCheck: false, thunk: false}).concat(epicMiddleware),
    preloadedState: createTestRootState(preloaded),
  })

  epicMiddleware.run(epic)
  return store
}
