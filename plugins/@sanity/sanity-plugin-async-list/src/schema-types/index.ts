import type {SchemaTypeDefinition} from 'sanity'

import type {AsyncListOption, AsyncListPluginConfig} from '../types'
import {asyncListType} from './async-list'

export const schema = <Option extends AsyncListOption>(
  config: AsyncListPluginConfig<Option>,
): {types: SchemaTypeDefinition[]} => {
  return {types: [asyncListType(config)]}
}
