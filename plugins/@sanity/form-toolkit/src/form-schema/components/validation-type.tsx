import type {StringInputProps} from 'sanity'
import {useFormValue} from 'sanity'

import type {FormField} from '../../form-renderer/components/types'
import {validationTypesByFieldType} from '../schema-types/form-field'

export const ValidationType = (props: StringInputProps) => {
  const {type} = useFormValue([...props.path.slice(0, 2)]) as FormField
  if (!type) return props.renderDefault(props)
  if (props.schemaType?.options) {
    props.schemaType.options.list = validationTypesByFieldType[type]
  }
  return props.renderDefault(props)
}
