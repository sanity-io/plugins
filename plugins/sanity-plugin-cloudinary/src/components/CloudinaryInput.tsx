import {useSecrets} from '@sanity/studio-secrets'
import {nanoid} from 'nanoid'
import {useCallback, useState} from 'react'
import {type ObjectInputProps, PatchEvent, set} from 'sanity'

import type {CloudinaryAsset, InsertHandlerParams} from '../types'
import {normalizeCloudinaryAsset, openMediaSelector} from '../utils'
import SecretsConfigView, {namespace, type Secrets} from './SecretsConfigView'
import WidgetInput from './WidgetInput'

const CloudinaryInput = (props: ObjectInputProps) => {
  const [showSettings, setShowSettings] = useState(false)
  const {secrets} = useSecrets<Secrets>(namespace)
  const {onChange, schemaType: type} = props
  const value = (props.value as CloudinaryAsset) || undefined
  const valueKey = value?._key

  const handleSelect = useCallback(
    (payload: InsertHandlerParams) => {
      const [asset] = payload.assets

      if (!asset) {
        return
      }

      onChange(
        PatchEvent.from([
          set({
            _type: type.name,
            _version: 1,
            _key: valueKey || nanoid(),
            ...normalizeCloudinaryAsset(asset),
          }),
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
