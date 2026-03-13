import type {PresetResult} from '../../types'
import {createLinkFieldType} from './schema'

export {LINK_FIELD_TYPE} from './constants'

export interface LinkFieldConfig {
  internalTypes?: string[]
}

export function linkField(config: LinkFieldConfig = {}): PresetResult {
  const internalTypes = config.internalTypes ?? []

  return {
    types: [createLinkFieldType(internalTypes)],
  }
}
