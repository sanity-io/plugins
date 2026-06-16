import {defineType, type StringDefinition} from 'sanity'

import {createAsyncListInput} from '../components/async-list'
import type {AsyncListPluginConfig} from '../types'

export const asyncListType = (config: AsyncListPluginConfig): StringDefinition =>
  defineType({
    name: config?.schemaType,
    type: 'string',
    components: {
      input: createAsyncListInput(config),
    },
  })
