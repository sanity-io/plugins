import {defineField, definePlugin, defineType} from 'sanity'
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

/** Page-builder block with a single image field, opened in a dialog (issue #1109). */
const mediaImageBlock = defineType({
  name: 'mediaImageBlock',
  title: 'Image block',
  type: 'object',
  options: {modal: {type: 'dialog'}},
  fields: [
    defineField({
      name: 'image',
      title: 'Block image',
      type: 'image',
    }),
  ],
})

const mediaPageType = defineType({
  name: 'mediaPage',
  title: 'Media Page',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'pageBuilder',
      title: 'Page builder',
      type: 'array',
      of: [{type: 'mediaImageBlock'}],
      options: {modal: {type: 'dialog'}},
    }),
  ],
})

export const mediaExample = definePlugin(() => ({
  schema: {types: [mediaProductType, mediaImageBlock, mediaPageType]},
  plugins: [media()],
}))
