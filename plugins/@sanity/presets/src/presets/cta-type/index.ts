import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'
import type {PresetsRegistryConfig} from '../../registry'

export interface CtaTypeConfig {
  registryConfig?: PresetsRegistryConfig
}

export const ctaType = definePresetType<CtaTypeConfig, 'object'>((context) => {
  const {registryConfig, fields, ...objectConfig} = context ?? {}
  const internalTypes = registryConfig?.link?.internalTypes ?? []
  const referenceTargets = internalTypes.map((typeName) => ({type: typeName}))

  return {
    name: 'cta',
    identifier: 'core.presets.cta',
    schemaType: defineType({
      name: 'core.presets.cta',
      title: 'Call to action',
      ...objectConfig,
      type: 'object',
      fields: [
        defineField({
          name: 'link',
          title: 'Link',
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
          ],
        }),
        defineField({
          name: 'level',
          title: 'Level',
          type: 'number',
          options: {
            layout: 'radio',
            list: [1, 2, 3],
          },
        }),
        ...(fields ?? []),
      ],
    }),
  }
})
