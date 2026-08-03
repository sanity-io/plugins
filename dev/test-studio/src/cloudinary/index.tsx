import {defineField, definePlugin, defineType} from 'sanity'
import {
  cloudinaryAssetDocument,
  cloudinaryAssetReference,
  cloudinaryAssetSourcePlugin,
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

// `cloudinaryReferencePlugin()` bundles the base Cloudinary schema types, which would
// collide with `cloudinarySchemaPlugin()`. To demonstrate both inline assets (with array
// functions) and reference assets in one workspace, register the reference schema types
// directly alongside the schema plugin instead of loading the reference plugin.
export const cloudinaryExample = definePlugin(() => ({
  schema: {types: [cloudinaryTest, cloudinaryAssetDocument, cloudinaryAssetReference]},
  plugins: [cloudinarySchemaPlugin(), cloudinaryAssetSourcePlugin()],
}))
