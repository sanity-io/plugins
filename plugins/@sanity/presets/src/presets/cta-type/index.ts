import {defineField, defineType} from 'sanity'

import {definePresetType, registryConfig} from '../../definePresetType'
import type {PresetsRegistryConfig} from '../../registry'

export const ctaType = definePresetType<{}, 'object'>((context) => {
  const {fields, ...objectConfig} = context ?? {}
  // oxlint-disable-next-line no-unsafe-type-assertion
  const config = context?.[registryConfig] as PresetsRegistryConfig | undefined
  const internalTypes = config?.link?.internalTypes ?? []
  const referenceTargets = internalTypes.map((typeName) => ({type: typeName}))

  return {
    name: 'cta',
    identifier: 'core.presets.cta',
    schemaType: defineType({
      name: 'cta',
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
