import {useClient} from 'sanity'

import type {PluginConfig} from '../types'

import {createCacheKey, peek, preloadWithKey, setFunctionCache} from '../cache'

export default function Preload(props: Required<Pick<PluginConfig, 'apiVersion' | 'languages'>>) {
  const client = useClient({apiVersion: props.apiVersion})

  // Use the same cache key structure as the main component
  // This should match the main component when selectedValue is empty
  const cacheKey = createCacheKey({})

  if (!Array.isArray(peek({}))) {
    preloadWithKey(async () => {
      if (Array.isArray(props.languages)) {
        return props.languages
      }
      const result = await props.languages(client, {})
      // Populate function cache for sharing with other components
      // Use the same key structure as the main component
      setFunctionCache(props.languages, {}, result)
      return result
    }, cacheKey)
  }

  return null
}
