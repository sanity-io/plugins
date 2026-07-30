import {PlugIcon} from '@sanity/icons/Plug'
import {useSecrets} from '@sanity/studio-secrets'
import {Button, Flex, Grid, Stack} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useMemo, useState} from 'react'
import {type ObjectInputProps, PatchEvent, set, unset, useClient} from 'sanity'

import {cloudinaryAssetSchema} from '../schema/cloudinaryAsset'
import type {InsertHandlerParams} from '../types'
import {normalizeCloudinaryAsset, openMediaSelector} from '../utils'
import ReferencePreview from './ReferencePreview'
import SecretsConfigView, {namespace, type Secrets} from './SecretsConfigView'

const API_VERSION = '2023-01-01'

// Fallback so the button doesn't stay disabled if the media library never reports it opened
const SELECTOR_FALLBACK_TIMEOUT = 30_000

type FolderOption = {path?: string; resource_type?: 'image' | 'video'}

type ReferenceValue = {
  _key?: string
  _type?: string
  asset?: {_type?: 'reference'; _ref?: string; _weak?: boolean}
}

const CloudinaryReferenceInput = (props: ObjectInputProps) => {
  const {onChange, value, schemaType} = props
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)
  const {secrets} = useSecrets<Secrets>(namespace)
  const client = useClient({apiVersion: API_VERSION})

  const cloudName = secrets?.cloudName
  const apiKey = secrets?.apiKey
  const hasConfig = Boolean(apiKey && cloudName)
  const currentValue = value as ReferenceValue | undefined

  const folder = (schemaType.options as {folder?: FolderOption} | undefined)?.folder
  const folderOption = useMemo(
    () =>
      folder?.path || folder?.resource_type
        ? {path: folder.path, resource_type: folder.resource_type}
        : undefined,
    [folder],
  )

  const setAssetReference = useCallback(
    (documentId: string) => {
      onChange(
        PatchEvent.from(
          set({
            _type: schemaType.name,
            // Preserve array item identity when this field is used inside an array
            ...(currentValue?._key ? {_key: currentValue._key} : {}),
            asset: {
              _type: 'reference',
              _ref: documentId,
              _weak: true,
            },
          }),
        ),
      )
    },
    [onChange, schemaType.name, currentValue?._key],
  )

  const handleSelect = useCallback(
    async (payload: InsertHandlerParams) => {
      const [asset] = payload.assets

      if (!asset) {
        return
      }

      const normalizedAsset = {
        _type: cloudinaryAssetSchema.name,
        _key: nanoid(),
        _version: 1,
        ...normalizeCloudinaryAsset(asset),
      }

      setIsLoading(true)
      try {
        // Check if this asset already exists in Sanity
        const existingAsset = await client.fetch<{_id: string} | null>(
          `*[_type == "cloudinaryAssetDocument" && asset.id == $id][0]`,
          {id: asset.id},
        )

        if (existingAsset) {
          // Update the existing asset and reference it
          await client.patch(existingAsset._id).set({asset: normalizedAsset}).commit()
          setAssetReference(existingAsset._id)
        } else {
          // Create a new asset document and reference it
          const newAsset = await client.create({
            _id: nanoid(),
            _type: 'cloudinaryAssetDocument',
            asset: normalizedAsset,
          })
          setAssetReference(newAsset._id)
        }

        // Force preview refresh when the same document is updated in place
        setPreviewRevision((revision) => revision + 1)
      } catch (err) {
        console.error('Error creating/updating Cloudinary asset:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [client, setAssetReference],
  )

  const handleOpenSelector = useCallback(() => {
    if (!cloudName || !apiKey) {
      setShowSettings(true)
      return
    }

    setIsLoading(true)

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    try {
      openMediaSelector(
        cloudName,
        apiKey,
        false, // single selection
        (payload) => {
          if (fallbackTimer) {
            clearTimeout(fallbackTimer)
          }
          // handleSelect manages isLoading for the create/patch work
          void handleSelect(payload)
        },
        undefined,
        () => {
          // Library opened — clear the "opening" loading state
          setIsLoading(false)
        },
        folderOption,
      )

      fallbackTimer = setTimeout(() => setIsLoading(false), SELECTOR_FALLBACK_TIMEOUT)
    } catch (error) {
      console.error('Error opening Cloudinary media selector:', error)
      setIsLoading(false)
    }
  }, [cloudName, apiKey, handleSelect, folderOption])

  const reference = currentValue?.asset

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
        <ReferencePreview value={reference} revision={previewRevision} />
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
