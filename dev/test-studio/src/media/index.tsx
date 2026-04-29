import {definePlugin} from 'sanity'
import {media} from 'sanity-plugin-media'

export const mediaExample = definePlugin(() => ({
  plugins: [media()],
}))
