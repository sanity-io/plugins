import {definePlugin, defineType} from 'sanity'
import {media, mediaField} from 'sanity-plugin-media'

/**
 * Media plugin wiring for e2e coverage of the Media tool, asset source picker,
 * folders/tags, and mediaField auto-tagging.
 */
const mediaProductType = defineType({
  type: 'document',
  name: 'mediaProduct',
  title: 'Media Product',
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
  schema: {types: [mediaProductType]},
  plugins: [media()],
}))
