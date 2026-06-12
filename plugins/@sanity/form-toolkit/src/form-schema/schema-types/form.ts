import {FaWpforms} from 'react-icons/fa'
import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

import type {FieldsOption} from '..'

export const formType = (fields: FieldsOption): SchemaTypeDefinition => {
  // const fieldsOf =
  //   fields && fields.length ? [{type: 'formField'}, ...fields] : [{type: 'formField'}]
  return defineType({
    name: 'form',
    title: 'Form',
    type: 'document',
    icon: FaWpforms,
    fields: [
      defineField({
        name: 'title',
        title: 'Form Title',
        type: 'string',
        description: 'Internal title for the form',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'id',
        title: 'Form ID',
        type: 'slug',
        options: {
          source: 'title',
        },
        // validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'fields',
        title: 'Form Fields',
        type: 'array',
        of: [{type: 'formField'}, ...fields],
      }),
      defineField({
        name: 'submitButton',
        title: 'Submit Button',
        type: 'object',
        fields: [
          defineField({
            name: 'text',
            title: 'Button Text',
            type: 'string',
            initialValue: 'Submit',
          }),
        ],
      }),
    ],
  })
}
