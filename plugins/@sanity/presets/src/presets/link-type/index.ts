import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface LinkTypeConfig {
  internalTypes?: string[]
}

export const linkType = definePresetType<LinkTypeConfig, 'object', 'preview'>({
  name: 'link',
  identifier: 'core.link',
  schemaType: ({internalTypes, fields, ...objectConfig}) => {
    const resolvedInternalTypes = internalTypes ?? []
    const referenceTargets = resolvedInternalTypes.map((type) => ({type}))

    return defineType({
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'linkType',
          type: 'string',
          title: 'Link Type',
          description:
            'Internal links point to a page in this project. External links point to a full URL.',
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
          description: 'The page this link points to.',
          to: referenceTargets,
          hidden: ({parent}) => parent?.linkType === 'external',
        }),
        defineField({
          name: 'url',
          type: 'url',
          title: 'URL',
          description:
            'Full URL including protocol, e.g. https://example.com. Supports http, https, mailto, and tel.',
          hidden: ({parent}) => parent?.linkType === 'internal',
          validation: (rule) =>
            rule.uri({
              scheme: ['http', 'https', 'mailto', 'tel'],
            }),
        }),
        defineField({
          name: 'openInNewTab',
          type: 'boolean',
          title: 'Open in New Tab',
          description:
            'Opens the link in a new browser tab. Recommended for links that take users away from the current site.',
          initialValue: false,
          hidden: ({parent}) => parent?.linkType === 'internal',
        }),
        ...(fields ?? []),
      ],
      preview: {
        select: {
          linkType: 'linkType',
          url: 'url',
          referenceTitle: 'reference.title',
          referenceName: 'reference.name',
        },
        prepare({linkType, url, referenceTitle, referenceName}) {
          const referenceLabel = referenceTitle || referenceName || 'No reference'
          const title = linkType === 'external' ? url || 'No URL' : referenceLabel

          return {
            title,
            subtitle: linkType === 'external' ? 'External link' : 'Internal link',
          }
        },
      },
    })
  },
})
