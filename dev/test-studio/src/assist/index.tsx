import {assist} from '@sanity/assist'
import {definePlugin} from 'sanity'

export const assistExample = definePlugin(() => ({
  plugins: [assist()],
}))
