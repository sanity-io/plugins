import {lazy} from 'react'
import {defineField, type FieldDefinition, type FieldProps} from 'sanity'

import {createFieldName} from '../components/createFieldName'
import {LANGUAGE_FIELD_NAME} from '../constants'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const InternationalizedInput = lazy(() => import('../components/InternationalizedInput'))

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
      }),
      // Hidden language field - stores the language identifier (e.g., 'en', 'fr')
      // This replaces the previous pattern of storing language in _key
      defineField({
        name: 'language',
        type: 'string',
        hidden: true,
        validation: (Rule) => Rule.required(),
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
