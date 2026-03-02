import {createContext, use, useContext, useMemo} from 'react'
import type {LayoutProps} from 'sanity'
import {useClient, useWorkspace} from 'sanity'

import {DEFAULT_CONFIG} from '../constants'
import type {PluginConfig, PluginConfigContext} from '../types'

const DocumentInternationalizationContext = createContext<PluginConfigContext>(DEFAULT_CONFIG)

export function useDocumentInternationalizationContext(): PluginConfigContext {
  return useContext(DocumentInternationalizationContext)
}

type DocumentInternationalizationProviderProps = LayoutProps & {
  pluginConfig: Required<PluginConfig>
}

// Simple promise cache for React.use
const promiseCache = new Map<string, Promise<PluginConfigContext['supportedLanguages']>>()

function createCacheKey(workspaceId: string): string {
  return `languages-${workspaceId}`
}

function createOrGetPromise(
  fn: () => Promise<PluginConfigContext['supportedLanguages']>,
  cacheKey: string,
): Promise<PluginConfigContext['supportedLanguages']> {
  const cached = promiseCache.get(cacheKey)
  if (cached) {
    return cached
  }
  const promise = fn()
  promiseCache.set(cacheKey, promise)
  return promise
}

/**
 * This Provider wraps the Studio and provides the DocumentInternationalization context to document actions and components.
 */
export function DocumentInternationalizationProvider(
  props: DocumentInternationalizationProviderProps,
): React.JSX.Element {
  const {pluginConfig} = props

  const client = useClient({apiVersion: pluginConfig.apiVersion})
  const workspace = useWorkspace()

  // Use a stable workspace identifier
  const workspaceId = useMemo(() => workspace.name ?? '', [workspace])

  // Create cache key for promise caching
  const cacheKey = useMemo(() => createCacheKey(workspaceId), [workspaceId])

  // Fetch or return languages
  const languagesPromise = useMemo(() => {
    if (Array.isArray(pluginConfig.supportedLanguages)) {
      return null // Return null for synchronous arrays
    }

    // Create or get cached promise for React.use
    return createOrGetPromise(async () => {
      if (typeof pluginConfig.supportedLanguages === 'function') {
        return pluginConfig.supportedLanguages(client)
      }
      return pluginConfig.supportedLanguages
    }, cacheKey)
  }, [pluginConfig, client, cacheKey])

  // Use React.use to handle the promise with Suspense, or return array directly
  const supportedLanguages = languagesPromise
    ? use(languagesPromise)
    : // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      (pluginConfig.supportedLanguages as PluginConfigContext['supportedLanguages'])

  return (
    <DocumentInternationalizationContext.Provider value={{...pluginConfig, supportedLanguages}}>
      {props.renderDefault(props)}
    </DocumentInternationalizationContext.Provider>
  )
}
