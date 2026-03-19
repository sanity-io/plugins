import type {DefineSchemaBase, IntrinsicTypeName, PreviewConfig, SchemaTypeDefinition} from 'sanity'

import type {PresetProvider, presetProvider} from './definePresetType'

export interface PresetResult {
  type: SchemaTypeDefinition
  [presetProvider]: PresetProvider
}

export type PartialSchemaDefinition<TypeName extends IntrinsicTypeName> = Partial<
  DefineSchemaBase<TypeName, TypeName> & {preview: PreviewConfig}
>
