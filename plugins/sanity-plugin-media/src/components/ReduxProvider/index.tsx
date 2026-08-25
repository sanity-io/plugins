import {configureStore, type Store, type UnknownAction} from '@reduxjs/toolkit'
import type {SanityClient} from '@sanity/client'
import {type ReactNode, useEffect, useState} from 'react'
import {Provider} from 'react-redux'
import {createEpicMiddleware, ofType} from 'redux-observable'
import {takeUntil} from 'rxjs'
import type {AssetSourceComponentProps, SanityDocument} from 'sanity'

import {rootEpic, rootReducer} from '../../modules'
import {initialState as assetsInitialState} from '../../modules/assets'
import type {RootReducerState} from '../../modules/types'
import getDocumentAssetIds from '../../utils/getDocumentAssetIds'
import {isSupportedAssetType} from '../../utils/isSupportedAssetType'

/** Stops the root epic when the Media browser unmounts (tool close / dialog dismiss / tests). */
const EPIC_END_TYPE = 'media/epicEnd' as const

type Props = {
  assetType?: AssetSourceComponentProps['assetType']
  children?: ReactNode
  client: SanityClient
  document?: SanityDocument
  excludeTagSlugs?: string[]
  selectedAssets?: AssetSourceComponentProps['selectedAssets']
}

type CreatedStore = {
  endEpics: () => void
  store: Store
}

function createReduxStore(props: Props): CreatedStore {
  const epicMiddleware = createEpicMiddleware<UnknownAction, UnknownAction, RootReducerState>({
    dependencies: {
      client: props.client,
    },
  })

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // TODO: remove once we're no longer storing non-serializable data in the store
        serializableCheck: false,
        thunk: false,
      }).prepend(epicMiddleware),
    devTools: true,
    preloadedState: {
      assets: {
        ...assetsInitialState,
        assetTypes: isSupportedAssetType(props?.assetType) ? [props.assetType] : ['file', 'image'],
        excludeTagSlugs: props.excludeTagSlugs?.length ? [...props.excludeTagSlugs] : [],
      },
      debug: {
        badConnection: false,
        enabled: false,
      },
      dialog: {items: []},
      folders: {
        byId: {},
        childrenByParentId: {},
        rootIds: [],
        exactCountByFolderId: {},
        unfiledCount: 0,
        currentFolderId: null,
        currentFolderUnfiled: false,
        panelVisible: false,
        fetching: false,
        fetchCount: -1,
        creating: false,
        renaming: false,
      },
      notifications: {items: []},
      search: {facets: [], query: ''},
      selected: {
        assets: props.selectedAssets || [],
        document: props.document,
        documentAssetIds: props.document ? getDocumentAssetIds(props.document) : [],
      },
      tags: {
        allIds: [],
        byIds: {},
        creating: false,
        fetchCount: -1,
        fetching: false,
        panelVisible: true,
      },
      uploads: {
        allIds: [],
        byIds: {},
      },
    },
  })

  // Scope the root epic so closing the browser tears down debounced fetches / listeners
  // instead of dispatching into an unmounted react-redux tree (Vitest jsdom teardown).
  epicMiddleware.run((action$, state$, dependencies) =>
    rootEpic(action$, state$, dependencies).pipe(takeUntil(action$.pipe(ofType(EPIC_END_TYPE)))),
  )

  return {
    store,
    endEpics: () => {
      store.dispatch({type: EPIC_END_TYPE})
    },
  }
}

function ReduxProvider({children, ...props}: Props) {
  const [{endEpics, store}] = useState(() => createReduxStore(props))

  useEffect(() => {
    return () => {
      endEpics()
    }
  }, [endEpics])

  return <Provider store={store}>{children}</Provider>
}

export default ReduxProvider
