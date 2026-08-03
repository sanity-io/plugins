import {type AssetSource, definePlugin, type Plugin} from 'sanity'

import {UnsplashIcon} from './components/Icon'
import {UnsplashAssetSource} from './components/UnsplashAssetSource'

export type {Asset, AssetDocument, UnsplashPhoto} from './types'

/**
 * @public
 */
export const unsplashAssetSource: AssetSource = {
  name: 'unsplash',
  // oxlint-disable-next-line no-deprecated -- `i18nKey` requires a locale bundle; a plain title is intentional here
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
