import {
  DatetimeDefinition,
  defineField,
  defineType,
  ObjectDefinition,
  ObjectSchemaType,
} from 'sanity'

import {RichDateInput} from './components/RichDateInput'

const richDateTypeName = 'richDate' as const

export type RichDateSchemaType = Omit<ObjectSchemaType, 'options'> & {
  options?: DatetimeDefinition['options']
}

/**
 *  @public
 */
export interface RichDateDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
  type: typeof richDateTypeName
  options?: DatetimeDefinition['options']
}

declare module 'sanity' {
  //allows the custom input to be valid for the schema def
  export interface IntrinsicDefinitions {
    richDate: RichDateDefinition
  }
}

export const richDateSchema = defineType({
  name: richDateTypeName,
  title: 'Rich Date',
  type: 'object',
  fields: [
    defineField({
      name: 'local',
      title: 'Local',
      type: 'string',
    }),
    defineField({
      name: 'utc',
      title: 'UTC',
      type: 'string',
    }),
    defineField({
      name: 'timezone',
      title: 'Timezone',
      type: 'string',
    }),
    defineField({
      name: 'offset',
      title: 'Offset',
      type: 'number',
    }),
  ],

  components: {
    input: RichDateInput,
  },
})
