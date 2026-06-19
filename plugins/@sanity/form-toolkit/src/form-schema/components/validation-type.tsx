import type {StringInputProps} from 'sanity'
import {useFormValue} from 'sanity'

import type {FormField} from '../../form-renderer/components/types'
import {validationTypesByFieldType} from '../schema-types/form-field'

export const ValidationType = (props: StringInputProps) => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- parent value shape is defined by the formField schema type
  const {type} = useFormValue(props.path.slice(0, 2)) as FormField
  if (!type || !props.schemaType?.options) return props.renderDefault(props)
  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {...props.schemaType.options, list: validationTypesByFieldType[type]},
    },
  })
}
