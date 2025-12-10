import {definePlugin} from 'sanity'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'

export const unsplashImageAssetExample = definePlugin(() => ({
  plugins: [unsplashImageAsset()],
}))
