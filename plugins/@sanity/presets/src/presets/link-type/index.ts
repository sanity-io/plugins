import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

type LinkToEntry = string | {type: string}

export interface LinkTypeConfig {
  to?: LinkToEntry[]
}

function normalizeToTargets(entries: LinkToEntry[]): {type: string}[] {
  return entries.map((entry) => (typeof entry === 'string' ? {type: entry} : entry))
}

export const linkType = definePresetType<LinkTypeConfig, 'object', 'preview'>({
  name: 'link',
  identifier: 'core.link',
  schemaType: ({to, fields, ...objectConfig}) => {
    const referenceTargets = normalizeToTargets(to ?? [])

    return defineType({
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'linkType',
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
          hidden: ({parent}) => parent?.linkType === 'external',
        }),
        defineField({
          name: 'url',
          type: 'url',
          title: 'URL',
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
