import type {DefineSchemaBase, IntrinsicTypeName, PreviewConfig, SchemaTypeDefinition} from 'sanity'

import type {PresetProvider, presetProvider} from './definePresetType'

export interface PresetResult {
  name: string
  identifier?: string
  [presetProvider]: PresetProvider
  type: SchemaTypeDefinition
}

export type PartialSchemaDefinition<TypeName extends IntrinsicTypeName> = Partial<
  DefineSchemaBase<TypeName, TypeName> & {preview: PreviewConfig}
>

export interface LinkConfig {
  internalTypes?: string[]
}
