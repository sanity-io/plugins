import type {SchemaTypeDefinition} from 'sanity'

import type {FieldsOption} from '..'
import {formType} from './form'
import {formFieldType} from './form-field'

export const schema = (fields: FieldsOption): {types: SchemaTypeDefinition[]} => {
  return {types: [formType(fields), formFieldType]}
}
