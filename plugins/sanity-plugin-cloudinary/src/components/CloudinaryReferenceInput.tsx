import {PlugIcon} from '@sanity/icons/Plug'
import {useSecrets} from '@sanity/studio-secrets'
import {Button, Flex, Grid, Stack} from '@sanity/ui'
import {nanoid} from 'nanoid'
import {useCallback, useMemo, useRef, useState} from 'react'
import {type ObjectInputProps, getPublishedId, PatchEvent, set, unset, useClient} from 'sanity'

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
  const {onChange, value, schemaType, readOnly} = props
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saveInProgressRef = useRef(false)
  const {secrets} = useSecrets<Secrets>(namespace)
  const client = useClient({apiVersion: API_VERSION})
  // Lookups should see published docs only so we never store drafts.* in _ref
  const publishedClient = useMemo(() => client.withConfig({perspective: 'published'}), [client])

  const cloudName = secrets?.cloudName
  const apiKey = secrets?.apiKey
  const hasConfig = Boolean(apiKey && cloudName)
  const currentValue = value as ReferenceValue | undefined
  const valueKey = currentValue?._key
  const schemaTypeName = schemaType.name
  const actionsDisabled = Boolean(readOnly) || isLoading

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
            _type: schemaTypeName,
            // Preserve array item identity when this field is used inside an array
            ...(valueKey ? {_key: valueKey} : {}),
            asset: {
              _type: 'reference',
              _ref: getPublishedId(documentId),
              _weak: true,
            },
          }),
        ),
      )
    },
    [onChange, schemaTypeName, valueKey],
  )

  const handleSelect = useCallback(
    async (payload: InsertHandlerParams) => {
      if (readOnly) {
        return
      }

      const [asset] = payload.assets

      if (!asset) {
        return
      }

      const normalizedAsset: Record<string, unknown> = {
        _type: cloudinaryAssetSchema.name,
        _key: nanoid(),
        _version: 1,
        ...normalizeCloudinaryAsset(asset),
      }

      setIsLoading(true)
      saveInProgressRef.current = true
      try {
        type ExistingAssetDoc = {_id: string; asset?: {id?: string}}

        // Prefer Cloudinary asset `id` when the Media Library provides it; otherwise
        // fall back to public_id + resource_type + type so we never query with a
        // missing id (which can match unrelated documents).
        const existingAsset = asset.id
          ? await publishedClient.fetch<ExistingAssetDoc | null>(
              `*[_type == "cloudinaryAssetDocument" && asset.id == $id][0]{_id, asset}`,
              {id: asset.id},
            )
          : asset.public_id
            ? await publishedClient.fetch<ExistingAssetDoc | null>(
                `*[_type == "cloudinaryAssetDocument" && asset.public_id == $publicId && asset.resource_type == $resourceType && asset.type == $type][0]{_id, asset}`,
                {
                  publicId: asset.public_id,
                  resourceType: asset.resource_type,
                  type: asset.type,
                },
              )
            : null

        if (existingAsset) {
          const publishedId = getPublishedId(existingAsset._id)
          // Preserve a previously stored Cloudinary id if this selection omits it
          const assetToStore =
            normalizedAsset['id'] || !existingAsset.asset?.id
              ? normalizedAsset
              : {...normalizedAsset, id: existingAsset.asset.id}

          await client.patch(publishedId).set({asset: assetToStore}).commit()
          setAssetReference(publishedId)
        } else {
          // Create a new asset document and reference it (let Sanity assign a valid _id)
          const newAsset = await client.create({
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
        saveInProgressRef.current = false
        setIsLoading(false)
      }
    },
    [readOnly, client, publishedClient, setAssetReference],
  )

  const handleOpenSelector = useCallback(() => {
    if (readOnly) {
      return
    }

    if (!cloudName || !apiKey) {
      setShowSettings(true)
      return
    }

    setIsLoading(true)

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
    }

    try {
      openMediaSelector(
        cloudName,
        apiKey,
        false, // single selection
        (payload) => {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current)
            fallbackTimerRef.current = undefined
          }
          // handleSelect manages isLoading for the create/patch work
          void handleSelect(payload)
        },
        undefined,
        () => {
          // Don't clear loading while create/patch is in flight — closing the
          // library after insert can fire showHandler mid-save.
          if (saveInProgressRef.current) {
            return
          }
          setIsLoading(false)
        },
        folderOption,
      )

      fallbackTimerRef.current = setTimeout(() => {
        if (!saveInProgressRef.current) {
          setIsLoading(false)
        }
      }, SELECTOR_FALLBACK_TIMEOUT)
    } catch (error) {
      console.error('Error opening Cloudinary media selector:', error)
      setIsLoading(false)
    }
  }, [readOnly, cloudName, apiKey, handleSelect, folderOption])

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
          disabled={Boolean(readOnly)}
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
            disabled={actionsDisabled}
            loading={isLoading}
          />

          {reference?._ref ? (
            <Button
              text="Remove"
              tone="critical"
              mode="ghost"
              onClick={() => onChange(PatchEvent.from(unset()))}
              disabled={actionsDisabled}
            />
          ) : null}
        </Grid>
      </Stack>
    </Stack>
  )
}

export default CloudinaryReferenceInput
