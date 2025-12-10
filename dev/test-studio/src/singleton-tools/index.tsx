import {singletonTools} from '@sanity/singleton-tools-plugin'
import {definePlugin} from 'sanity'

export const singletonToolsExample = definePlugin(() => ({
  plugins: [singletonTools()],
}))
