import type {PresetResult} from '../../types'
import {createLinkFieldType} from './schema'

export {LINK_FIELD_TYPE} from './constants'

export interface LinkFieldConfig {
  internalTypes: string[]
}

export function linkField(config: LinkFieldConfig): PresetResult {
  if (config.internalTypes.length === 0) {
    throw new Error('[@sanity/presets] linkField requires at least one internalTypes entry.')
  }

  return {
    types: [createLinkFieldType(config.internalTypes)],
  }
}
