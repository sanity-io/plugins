import {defineField, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export const ctaType = definePresetType<{}, 'object', 'preview'>({
  name: 'cta',
  identifier: 'core.cta',
  schemaType: (config, registry) => {
    const {fields, ...objectConfig} = config

    return defineType({
      ...objectConfig,
      type: 'object',
      fields: [
        registry.getPreset('link', {name: 'link', title: 'Link'}),
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
      preview: {
        select: {
          linkType: 'link.linkType',
          url: 'link.url',
          referenceTitle: 'link.reference.title',
          referenceName: 'link.reference.name',
        },
        prepare({linkType, url, referenceTitle, referenceName}) {
          const referenceLabel = referenceTitle || referenceName || 'No reference'
          const title = linkType === 'external' ? url || 'No URL' : referenceLabel
          return {title, subtitle: 'Button'}
        },
      },
    })
  },
})
