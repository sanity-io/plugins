import {type AssetSource, definePlugin, isArrayOfObjectsInputProps} from 'sanity'

import {CloudinaryAssetSource} from './components/asset-source/CloudinaryAssetSource'
import {CloudinaryIcon} from './components/asset-source/Icon'
import {AssetListFunctions} from './components/AssetListFunctions'
import {cloudinaryAssetSchema} from './schema/cloudinaryAsset'
import {cloudinaryAssetContext} from './schema/cloudinaryAssetContext'
import {cloudinaryAssetContextCustom} from './schema/cloudinaryAssetContextCustom'
import {cloudinaryAssetDerivedSchema} from './schema/cloudinaryAssetDerived'

export {type CloudinaryAssetContext} from './schema/cloudinaryAssetContext'
export {type CloudinaryAssetDerived} from './schema/cloudinaryAssetDerived'
export {type CloudinaryAssetContextCustom} from './schema/cloudinaryAssetContextCustom'

export type {AssetDocument, CloudinaryAsset} from './types'

export {
  cloudinaryAssetSchema,
  cloudinaryAssetDerivedSchema,
  cloudinaryAssetContext,
  cloudinaryAssetContextCustom,
}

export const cloudinarySchemaPlugin = definePlugin({
  name: 'cloudinary-schema',
  form: {
    components: {
      input: (props) => {
        if (isArrayOfObjectsInputProps(props)) {
          const cloudinaryType = props.schemaType.of.find(
            (t: {name: string}) => t.name === cloudinaryAssetSchema.name,
          )
          if (cloudinaryType) {
            return props.renderDefault({...props, arrayFunctions: AssetListFunctions})
          }
        }
        return props.renderDefault(props)
      },
    },
  },
  schema: {
    types: [
      cloudinaryAssetSchema,
      cloudinaryAssetDerivedSchema,
      cloudinaryAssetContext,
      cloudinaryAssetContextCustom,
    ],
  },
})

export const cloudinaryImageSource: AssetSource = {
  name: 'cloudinary-image',
  title: 'Cloudinary',
  icon: CloudinaryIcon,
  component: CloudinaryAssetSource,
}

export const cloudinaryAssetSourcePlugin = definePlugin({
  name: 'cloudinart-asset-source',
  form: {
    image: {
      assetSources: [cloudinaryImageSource],
    },
  },
})
