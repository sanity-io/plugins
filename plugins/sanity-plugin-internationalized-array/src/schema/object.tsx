import {lazy, Suspense} from 'react'
import {defineField, type FieldDefinition, type FieldProps, type ObjectItemProps} from 'sanity'

import {createFieldName} from '../components/createFieldName'
import {LANGUAGE_FIELD_NAME} from '../constants'
import type {InternationalizedArrayItem} from '../types'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const InternationalizedInputLazy = lazy(() => import('../components/InternationalizedInput'))

/**
 * The document form suspends as one tree, and that tree includes the field
 * group tabs. Loading the item here keeps that fallback inside the field,
 * so the tabs stay mounted and keep the width they already measured.
 */
function InternationalizedInput(props: ObjectItemProps<InternationalizedArrayItem>) {
  return (
    <Suspense fallback={null}>
      <InternationalizedInputLazy {...props} />
    </Suspense>
  )
}

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
