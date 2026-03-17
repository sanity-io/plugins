import {debugLiveSyncTags} from '@sanity/debug-live-sync-tags'
import {definePlugin} from 'sanity'

export const debugLiveSyncTagsExample = definePlugin(() => ({
  plugins: [debugLiveSyncTags()],
}))
