import type {SchemaTypeDefinition} from 'sanity'

import type {PresetProvider, presetProvider} from './definePresetType'

export interface PresetResult {
  type: SchemaTypeDefinition
  [presetProvider]: PresetProvider
}
