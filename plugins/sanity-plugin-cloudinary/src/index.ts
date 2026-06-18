import {type AssetSource, definePlugin, isArrayOfObjectsInputProps} from 'sanity'

import {CloudinaryAssetSource} from './components/asset-source/CloudinaryAssetSource'
import {CloudinaryIcon} from './components/asset-source/Icon'
import {AssetListFunctions} from './components/AssetListFunctions'
import {cloudinaryAssetSchema} from './schema/cloudinaryAsset'
import {cloudinaryAssetContext} from './schema/cloudinaryAssetContext'
import {cloudinaryAssetContextCustom} from './schema/cloudinaryAssetContextCustom'
import {cloudinaryAssetDerivedSchema} from './schema/cloudinaryAssetDerived'
import {cloudinaryAssetDocument} from './schema/cloudinaryAssetDocument'
import {cloudinaryAssetReference} from './schema/cloudinaryAssetReference'

export {type CloudinaryAssetContext} from './schema/cloudinaryAssetContext'
export {type CloudinaryAssetDerived} from './schema/cloudinaryAssetDerived'
export {type CloudinaryAssetContextCustom} from './schema/cloudinaryAssetContextCustom'

export type {AssetDocument, CloudinaryAsset} from './types'

export {
  cloudinaryAssetSchema,
  cloudinaryAssetDerivedSchema,
  cloudinaryAssetContext,
  cloudinaryAssetContextCustom,
  cloudinaryAssetDocument,
  cloudinaryAssetReference,
}

export const cloudinaryReferencePlugin = definePlugin({
  name: 'cloudinary-reference',
  schema: {
    types: [
      cloudinaryAssetDocument,
      cloudinaryAssetReference,
      cloudinaryAssetSchema,
      cloudinaryAssetDerivedSchema,
      cloudinaryAssetContext,
      cloudinaryAssetContextCustom,
    ],
  },
})

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
  name: 'cloudinary-asset-source',
  form: {
    image: {
      assetSources: [cloudinaryImageSource],
    },
  },
})
