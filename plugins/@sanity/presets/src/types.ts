import type {DefineSchemaBase, IntrinsicTypeName, PreviewConfig, SchemaTypeDefinition} from 'sanity'

export interface PresetResult {
  identifier?: string
  type: SchemaTypeDefinition
}

export type PartialSchemaDefinition<TypeName extends IntrinsicTypeName> = Partial<
  DefineSchemaBase<TypeName, TypeName> & {preview: PreviewConfig}
>
