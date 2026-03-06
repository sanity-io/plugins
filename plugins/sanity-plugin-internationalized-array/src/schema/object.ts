import {defineField, type FieldDefinition, type FieldProps} from 'sanity'

import {createFieldName} from '../components/createFieldName'
import InternationalizedInput from '../components/InternationalizedInput'
import {LANGUAGE_FIELD_NAME} from '../constants'

type ObjectFactoryConfig = {
  type: string | FieldDefinition
}

export default (config: ObjectFactoryConfig) => {
  const {type} = config
  const typeName = typeof type === `string` ? type : type.name
  const objectName = createFieldName(typeName, true)

  return defineField({
    name: objectName,
    title: `Internationalized array ${typeName}`,
    type: 'object',
    components: {
      // @ts-expect-error - fix typings
      item: InternationalizedInput,
      field: (props: FieldProps) =>
        props.renderDefault({
          ...props,
          // Reset the level to avoid nested styling
          level: 0,
        }),
    },
    fields: [
      defineField({
        ...(typeof type === 'string' ? {type} : type),
        name: 'value',
        components: {
          field: (props: FieldProps) => props.renderDefault({...props, title: ''}),
        },
      }),
    ],
    preview: {
      select: {
        title: 'value',
        subtitle: LANGUAGE_FIELD_NAME,
      },
    },
  })
}
