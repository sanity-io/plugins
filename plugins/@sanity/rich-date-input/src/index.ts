import {definePlugin} from 'sanity'

import {RichDateDefinition, richDateSchema, RichDateSchemaType} from './schema'
import {RichDate} from './types'

export const richDate = definePlugin({
  name: 'v3-rich-date-input',
  schema: {
    types: [richDateSchema],
  },
})

export type {RichDate, RichDateDefinition, RichDateSchemaType}
