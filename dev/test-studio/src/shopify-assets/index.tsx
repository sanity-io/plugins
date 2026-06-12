import {definePlugin} from 'sanity'
import {shopifyAssets} from 'sanity-plugin-shopify-assets'

export const shopifyAssetsExample = definePlugin(() => ({
  plugins: [shopifyAssets()],
}))
