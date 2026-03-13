import type {BasePresetConfig, PresetResult} from '../../types'
import {LINK_FIELD_TYPE} from './constants'
import {createLinkFieldType} from './schema'

export {LINK_FIELD_TYPE}

export interface LinkFieldConfig extends BasePresetConfig {
  internalTypes: string[]
}

export function linkField(config: LinkFieldConfig): PresetResult {
  if (config.internalTypes.length === 0) {
    throw new Error('[@sanity/presets] linkField requires at least one internalTypes entry.')
  }

  const typeName = config.name ?? LINK_FIELD_TYPE

  return {
    types: [createLinkFieldType(typeName, config.internalTypes)],
  }
}
