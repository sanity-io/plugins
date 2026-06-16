import {defineType, type StringDefinition} from 'sanity'

import {AsyncList} from '../components/async-list'
import type {AsyncListPluginConfig} from '../types'

export const asyncListType = (config: AsyncListPluginConfig): StringDefinition =>
  defineType({
    name: config?.schemaType,
    type: 'string',
    components: {
      input: (props) => AsyncList(props, config),
    },
  })
