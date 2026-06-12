import type {SchemaTypeDefinition} from 'sanity'

import type {AsyncListPluginConfig} from '..'
import {asyncListType} from './async-list'

export const schema = (config: AsyncListPluginConfig): {types: SchemaTypeDefinition[]} => {
  return {types: [asyncListType(config)]}
}
