import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import type {PresetsRegistryConfig} from '../../registry'

export interface LinkTypeConfig {
  internalTypes?: string[]
}

export const linkType = definePresetType<LinkTypeConfig, 'object', 'preview'>(
  (config, registry) => {
    const {internalTypes, fields, ...objectConfig} = config
    // xxx debug assertion
    const registryLinkConfig = (registry.registryConfig as PresetsRegistryConfig).link
    const resolvedInternalTypes = internalTypes ?? registryLinkConfig?.internalTypes ?? []
    const referenceTargets = resolvedInternalTypes.map((typeName) => ({type: typeName}))

    return {
      name: 'link',
      identifier: 'core.presets.link',
      schemaType: defineType({
        name: 'link',
        title: 'Link',
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
          },
          prepare({linkType, url, referenceTitle}) {
            const title =
              linkType === 'external' ? url || 'No URL' : referenceTitle || 'No reference'

            return {
              title,
              subtitle: linkType === 'external' ? 'External link' : 'Internal link',
            }
          },
        },
      }),
    }
  },
)
