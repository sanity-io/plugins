import {definePlugin} from 'sanity'

import type {RichDate} from './types'

import {type RichDateDefinition, richDateSchema, type RichDateSchemaType} from './schema'

export const richDate = definePlugin({
  name: 'v3-rich-date-input',
  schema: {
    types: [richDateSchema],
  },
})

export type {RichDate, RichDateDefinition, RichDateSchemaType}
