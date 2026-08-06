import {definePlugin} from 'sanity'
import {media} from 'sanity-plugin-media'

/**
 * Media plugin wiring for e2e coverage of the Media tool (browse + asset edit).
 */
export const mediaExample = definePlugin(() => ({
  plugins: [media()],
}))
