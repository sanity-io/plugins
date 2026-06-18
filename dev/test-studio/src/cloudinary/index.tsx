import {defineField, definePlugin, defineType} from 'sanity'
import {
  cloudinaryAssetSourcePlugin,
  cloudinaryReferencePlugin,
  cloudinarySchemaPlugin,
} from 'sanity-plugin-cloudinary'

const cloudinaryTest = defineType({
  type: 'document',
  name: 'cloudinaryTest',
  title: 'Cloudinary',
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'cloudinary.asset',
      name: 'asset',
      title: 'Cloudinary asset',
      description: 'This asset is served from Cloudinary',
    }),
    defineField({
      type: 'array',
      name: 'assetList',
      title: 'Cloudinary asset list',
      description: 'These assets are served from Cloudinary',
      of: [{type: 'cloudinary.asset'}],
    }),
    defineField({
      type: 'image',
      name: 'image',
      title: 'Image',
      description: 'Sanity image with Cloudinary as an asset source',
    }),
    defineField({
      type: 'cloudinaryAssetReference',
      name: 'assetReference',
      title: 'Cloudinary asset reference',
      description: 'A reference to a shared Cloudinary asset document',
    }),
  ],
})

export const cloudinaryExample = definePlugin(() => ({
  schema: {types: [cloudinaryTest]},
  plugins: [cloudinarySchemaPlugin(), cloudinaryAssetSourcePlugin(), cloudinaryReferencePlugin()],
}))
