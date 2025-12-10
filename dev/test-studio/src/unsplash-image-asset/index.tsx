import {definePlugin, defineType, defineField} from 'sanity'
import {unsplashImageAsset, UnsplashIcon} from 'sanity-plugin-asset-source-unsplash'

const unsplashTest = defineType({
  type: 'document',
  name: 'unsplashTest',
  title: 'Unsplash',
  icon: UnsplashIcon,
  fields: [
    {
      title: 'Title',
      name: 'Title',
      type: 'string',
    },
    defineField({
      type: 'image',
      name: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})

export const unsplashImageAssetExample = definePlugin(() => ({
  plugins: [unsplashImageAsset()],
  schema: {types: [unsplashTest]},
}))
