import {PlugIcon} from '@sanity/icons'
import {useSecrets} from '@sanity/studio-secrets'
import {Button, Flex, Grid, Stack} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useMemo, useState} from 'react'
import {type ObjectInputProps, PatchEvent, set, unset, useClient} from 'sanity'

import type {InsertHandlerParams} from '../types'
import {openMediaSelector} from '../utils'
import ReferencePreview from './ReferencePreview'
import SecretsConfigView, {namespace, type Secrets} from './SecretsConfigView'

const API_VERSION = '2023-01-01'

// Fallback so the button doesn't stay disabled if the media library never reports it opened
const SELECTOR_FALLBACK_TIMEOUT = 30_000

type FolderOption = {path?: string; resource_type?: 'image' | 'video'}

const CloudinaryReferenceInput = (props: ObjectInputProps) => {
  const {onChange, value, schemaType} = props
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const {secrets} = useSecrets<Secrets>(namespace)
  const client = useClient({apiVersion: API_VERSION})

  const cloudName = secrets?.cloudName
  const apiKey = secrets?.apiKey
  const hasConfig = Boolean(apiKey && cloudName)

  const folder = (schemaType.options as {folder?: FolderOption} | undefined)?.folder
  const folderOption = useMemo<FolderOption>(
    () => (folder ? {path: folder.path, resource_type: folder.resource_type} : {}),
    [folder],
  )

  const handleSelect = useCallback(
    async (payload: InsertHandlerParams) => {
      const [asset] = payload.assets

      if (!asset) {
        return
      }

      try {
        // Check if this asset already exists in Sanity
        const existingAsset = await client.fetch<{_id: string} | null>(
          `*[_type == "cloudinaryAssetDocument" && asset.id == $id][0]`,
          {id: asset.id},
        )

        if (existingAsset) {
          // Update the existing asset and reference it
          await client.patch(existingAsset._id).set({asset}).commit()
          onChange(PatchEvent.from(set({_type: 'reference', _ref: existingAsset._id, _weak: true})))
        } else {
          // Create a new asset document and reference it
          const newAsset = await client.create({
            _id: nanoid(),
            _type: 'cloudinaryAssetDocument',
            asset: {...asset, _type: 'cloudinaryAssetReference', _key: nanoid()},
          })
          onChange(PatchEvent.from(set({_type: 'reference', _ref: newAsset._id, _weak: true})))
        }
      } catch (err) {
        console.error('Error creating/updating Cloudinary asset:', err)
      }
    },
    [client, onChange],
  )

  const handleOpenSelector = useCallback(() => {
    if (!cloudName || !apiKey) {
      setShowSettings(true)
      return
    }

    setIsLoading(true)

    try {
      openMediaSelector(
        cloudName,
        apiKey,
        false, // single selection
        (payload) => {
          void handleSelect(payload)
          setIsLoading(false)
        },
        undefined,
        () => setIsLoading(false),
        folderOption,
      )

      setTimeout(() => setIsLoading(false), SELECTOR_FALLBACK_TIMEOUT)
    } catch (error) {
      console.error('Error opening Cloudinary media selector:', error)
      setIsLoading(false)
    }
  }, [cloudName, apiKey, handleSelect, folderOption])

  const reference = value as {_ref?: string} | undefined

  let selectButtonText = 'Configure Cloudinary to Select Assets'
  if (hasConfig) {
    selectButtonText = isLoading ? 'Opening Media Library...' : 'Select Asset'
  }

  return (
    <Stack gap={3}>
      {showSettings && <SecretsConfigView onClose={() => setShowSettings(false)} />}

      <Flex justify="flex-end">
        <Button
          color="primary"
          icon={PlugIcon}
          mode="bleed"
          title="Configure"
          onClick={() => setShowSettings(true)}
          text={hasConfig ? undefined : 'Configure Cloudinary plugin'}
        />
      </Flex>

      <Flex marginBottom={2} style={{textAlign: 'center', width: '100%'}}>
        <ReferencePreview value={reference} />
      </Flex>

      <Stack gap={2}>
        <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
          <Button
            text={selectButtonText}
            onClick={handleOpenSelector}
            tone="primary"
            mode="ghost"
            disabled={(!hasConfig && !showSettings) || isLoading}
            loading={isLoading}
          />

          {reference?._ref ? (
            <Button
              text="Remove"
              tone="critical"
              mode="ghost"
              onClick={() => onChange(PatchEvent.from(unset()))}
              disabled={isLoading}
            />
          ) : null}
        </Grid>
      </Stack>
    </Stack>
  )
}

export default CloudinaryReferenceInput
