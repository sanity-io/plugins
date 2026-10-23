import {defineType, type StringDefinition} from 'sanity'

import {createAsyncListInput} from '../components/async-list'
import type {AsyncListOption, AsyncListPluginConfig} from '../types'

export const asyncListType = <Option extends AsyncListOption>(
  config: AsyncListPluginConfig<Option>,
): StringDefinition =>
  defineType({
    name: config?.schemaType,
    type: 'string',
    components: {
      input: createAsyncListInput(config),
    },
  })
