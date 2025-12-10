import {definePlugin, defineType} from 'sanity'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'

const unsplashPostType = defineType({
  type: 'document',
  name: 'unsplashPost',
  title: 'Unsplash',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'image', name: 'image', title: 'Image'},
  ],
})

export const unsplashExample = definePlugin(() => ({
  schema: {types: [unsplashPostType]},
  plugins: [unsplashImageAsset()],
}))
