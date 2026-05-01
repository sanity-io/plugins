import type {DefineSchemaBase, IntrinsicTypeName, PreviewConfig} from 'sanity'

export type PartialSchemaDefinition<TypeName extends IntrinsicTypeName> = Partial<
  DefineSchemaBase<TypeName, TypeName> & {preview: PreviewConfig}
> &
  Pick<DefineSchemaBase<TypeName, TypeName>, 'name'>
