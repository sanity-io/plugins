import {useSecrets} from '@sanity/studio-secrets'
import {nanoid} from 'nanoid'
import {useCallback, useState} from 'react'
import {type ObjectInputProps, PatchEvent, set} from 'sanity'

import type {CloudinaryAsset, CloudinaryAssetResponse, InsertHandlerParams} from '../types'
import {openMediaSelector} from '../utils'
import SecretsConfigView, {namespace, type Secrets} from './SecretsConfigView'
import WidgetInput from './WidgetInput'

const CloudinaryInput = (props: ObjectInputProps) => {
  const [showSettings, setShowSettings] = useState(false)
  const {secrets} = useSecrets<Secrets>(namespace)
  const {onChange, schemaType: type} = props
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - object input value narrowed to CloudinaryAsset
  const value = (props.value as CloudinaryAsset) || undefined
  const valueKey = value?._key

  const handleSelect = useCallback(
    (payload: InsertHandlerParams) => {
      const [asset] = payload.assets

      if (!asset) {
        return
      }

      let updatedAsset = asset

      // Update the asset with the new custom values
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion - Cloudinary widget response filtered to schema shape
      const assetWithoutNulls = Object.fromEntries(
        Object.entries(asset).filter(([_, assetValue]) => assetValue !== null),
      ) as CloudinaryAssetResponse

      // Ensure we preserve the required fields from the original asset
      const requiredFields = {
        public_id: asset.public_id,
        resource_type: asset.resource_type,
        type: asset.type,
        url: asset.url,
        secure_url: asset.secure_url,
        format: asset.format,
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        tags: asset.tags,
      }
      updatedAsset = {
        ...assetWithoutNulls,
        ...requiredFields,
      }

      //The metadata in Sanity Studio cannot contain special characters,
      //hence the cloudinary metadata (context) needs to be transformed to valid object keys
      if (asset.context) {
        const objectWithRenamedKeys = Object.fromEntries(
          Object.entries(asset.context.custom).map(([contextKey, contextValue]) => {
            return [contextKey.replace(/[^a-zA-Z0-9_]|-/g, '_'), contextValue]
          }),
        )

        // Update the asset with the new custom values
        updatedAsset = {
          ...updatedAsset,
          context: {
            ...asset.context,
            custom: objectWithRenamedKeys,
          },
        }
      }

      // Handle derived field - only include if not null
      if (asset.derived) {
        const derivedWithType = asset.derived.map((derivedItem) => ({
          _type: 'derived',
          url: derivedItem.url,
          secure_url: derivedItem.secure_url,
          raw_transformation: derivedItem.raw_transformation,
        }))

        updatedAsset = {
          ...updatedAsset,
          derived: derivedWithType,
        }
      }

      onChange(
        PatchEvent.from([
          set(
            Object.assign(
              {
                _type: type.name,
                _version: 1,
                _key: valueKey || nanoid(),
              },
              updatedAsset,
            ),
          ),
        ]),
      )
    },
    [onChange, type, valueKey],
  )

  const action = secrets
    ? () =>
        openMediaSelector(
          secrets.cloudName,
          secrets.apiKey,
          false, // single selection
          handleSelect,
          value,
        )
    : () => setShowSettings(true)

  return (
    <>
      {showSettings && <SecretsConfigView onClose={() => setShowSettings(false)} />}
      <WidgetInput onSetup={() => setShowSettings(true)} openMediaSelector={action} {...props} />
    </>
  )
}

export default CloudinaryInput
