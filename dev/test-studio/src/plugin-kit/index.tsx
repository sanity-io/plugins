import {pluginKit} from '@sanity/plugin-kit'
import {definePlugin} from 'sanity'

export const pluginKitExample = definePlugin(() => ({
  plugins: [pluginKit()],
}))
