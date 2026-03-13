import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

import {LINK_FIELD_TYPE} from './constants'

export function createLinkFieldType(internalTypes: string[]): SchemaTypeDefinition {
  const referenceTargets =
    internalTypes.length > 0
      ? internalTypes.map((typeName) => ({type: typeName}))
      : [{type: 'document'}]

  return defineType({
    name: LINK_FIELD_TYPE,
    type: 'object',
    title: 'Link',
    fields: [
      defineField({
        name: 'type',
        type: 'string',
        title: 'Link Type',
        initialValue: 'internal',
        options: {
          layout: 'radio',
          list: [
            {title: 'Internal', value: 'internal'},
            {title: 'External', value: 'external'},
          ],
        },
      }),
      defineField({
        name: 'reference',
        type: 'reference',
        title: 'Internal Link',
        to: referenceTargets,
        hidden: ({parent}) => parent?.type !== 'internal',
      }),
      defineField({
        name: 'url',
        type: 'url',
        title: 'URL',
        hidden: ({parent}) => parent?.type !== 'external',
        validation: (rule) =>
          rule.uri({
            scheme: ['http', 'https', 'mailto', 'tel'],
          }),
      }),
      defineField({
        name: 'openInNewTab',
        type: 'boolean',
        title: 'Open in New Tab',
        initialValue: false,
        hidden: ({parent}) => parent?.type !== 'external',
      }),
    ],
    preview: {
      select: {
        type: 'type',
        url: 'url',
        referenceTitle: 'reference.title',
      },
      prepare({type, url, referenceTitle}) {
        const title = type === 'external' ? url || 'No URL' : referenceTitle || 'No reference'

        return {
          title,
          subtitle: type === 'external' ? 'External link' : 'Internal link',
        }
      },
    },
  })
}
