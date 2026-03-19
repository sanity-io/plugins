import type {PresetResult} from '../../types'
import {createLinkType} from './schema'

export {LINK_TYPE_NAME} from './constants'

export interface LinkTypeConfig {
  internalTypes: string[]
}

export function linkType(config: LinkTypeConfig): PresetResult {
  if (config.internalTypes.length === 0) {
    throw new Error('[@sanity/presets] linkType requires at least one internalTypes entry.')
  }

  return {
    types: [createLinkType(config.internalTypes)],
  }
}
