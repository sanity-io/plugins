import {type AssetSource, definePlugin, type Plugin} from 'sanity'

import {UnsplashIcon} from './components/Icon'
import {UnsplashAssetSource} from './components/UnsplashAssetSource'

export type {Asset, AssetDocument, UnsplashPhoto} from './types'

/**
 * @public
 */
export const unsplashAssetSource: AssetSource = {
  name: 'unsplash',
  title: 'Unsplash',
  component: UnsplashAssetSource,
  icon: UnsplashIcon,
}

/**
 * @public
 */
export const unsplashImageAsset: Plugin = definePlugin({
  name: 'asset-source-unsplash-plugin',

  form: {
    image: {
      assetSources: [unsplashAssetSource],
    },
  },
})

export {UnsplashIcon}
