// oxlint-disable typescript/no-deprecated - legacy code will be lint-cleaned in a follow-up PR
import {configureStore} from '@reduxjs/toolkit'
import {studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {render, type RenderResult} from '@testing-library/react'
import type {ReactElement, ReactNode} from 'react'
import {Provider} from 'react-redux'
import {ColorSchemeProvider} from 'sanity'
import type {AssetSourceComponentProps} from 'sanity'

import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import {rootReducer} from '../../modules'
import type {RootReducerState} from '../../modules/types'
import type {MediaToolOptions} from '../../types'
import {createTestRootState} from './rootState'

type Opts = {
  onSelect?: AssetSourceComponentProps['onSelect']
  preloaded?: Partial<RootReducerState>
  toolOptions?: Partial<MediaToolOptions>
}

function createTestStore(preloaded?: Partial<RootReducerState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({thunk: false, serializableCheck: false}),
    preloadedState: createTestRootState(preloaded),
  })
}

// The explicit `RenderResult` return annotation keeps the exported type portable for
// declaration emit (TS2883): the inferred type otherwise expands into non-portable
// deep paths from `react-dom/client` and `pretty-format`.
export function renderWithProviders(
  ui: ReactElement,
  opts: Opts = {},
): RenderResult & {store: ReturnType<typeof createTestStore>} {
  const {onSelect, preloaded, toolOptions} = opts

  const store = createTestStore(preloaded)

  const options: MediaToolOptions = {
    creditLine: {enabled: false},
    directUploads: true,
    ...toolOptions,
  }

  const wrap = (node: ReactNode) => (
    <Provider store={store}>
      <ColorSchemeProvider scheme="light">
        <ToolOptionsProvider options={options}>
          <ThemeProvider theme={studioTheme}>
            <ToastProvider>
              <AssetBrowserDispatchProvider onSelect={onSelect}>
                {node}
              </AssetBrowserDispatchProvider>
            </ToastProvider>
          </ThemeProvider>
        </ToolOptionsProvider>
      </ColorSchemeProvider>
    </Provider>
  )

  return {store, ...render(wrap(ui))}
}
