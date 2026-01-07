import {richDate} from '@sanity/rich-date-input'
import {definePlugin} from 'sanity'

export const richDateInputExample = definePlugin(() => ({
  plugins: [richDate()],
}))
