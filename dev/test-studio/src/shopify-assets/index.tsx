import {defineField, definePlugin, defineType} from 'sanity'
import {shopifyAssets} from 'sanity-plugin-shopify-assets'

const shopifyAssetsTest = defineType({
  type: 'document',
  name: 'shopifyAssetsTest',
  title: 'Shopify Assets',
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'shopify.asset',
      name: 'shopifyAsset',
      title: 'Shopify asset (plugin-level domain)',
    }),
    defineField({
      type: 'shopify.asset',
      name: 'shopifyAssetFieldDomain',
      title: 'Shopify asset (field-level domain)',
      options: {
        shopifyDomain: 'sanity-plugins-test.myshopify.com',
      },
    }),
  ],
})

export const shopifyAssetsExample = definePlugin(() => ({
  schema: {types: [shopifyAssetsTest]},
  plugins: [shopifyAssets({shopifyDomain: 'sanity-plugins-test.myshopify.com'})],
}))
