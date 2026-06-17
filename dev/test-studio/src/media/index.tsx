import {ImagesIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'
import {media, mediaField} from 'sanity-plugin-media'

import {issue1109ReproTypes} from './issue-1109-repro'

// Modeled on the dev studio config the plugin shipped with in its standalone
// repo (see plugins/sanity-plugin-media/sanity.config.ts)
const mediaProductType = defineType({
  type: 'document',
  name: 'mediaProduct',
  title: 'Media Product',
  icon: ImagesIcon,
  fields: [
    {type: 'string', name: 'name', title: 'Name'},
    mediaField({
      name: 'image',
      title: 'Image',
      type: 'image',
      mediaTags: ['product'],
    }),
    mediaField({
      name: 'attachment',
      title: 'Attachment',
      type: 'file',
      mediaTags: ['product'],
    }),
  ],
})

export const mediaExample = definePlugin(() => ({
  schema: {types: [mediaProductType, ...issue1109ReproTypes]},
  plugins: [media()],
}))
