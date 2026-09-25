import {Box, Button, Card, Flex, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {type SubmitHandler, useForm, useFormState} from 'react-hook-form'
import {WithReferringDocuments, useColorSchemeValue, useDocumentStore} from 'sanity'
import {waitFor} from 'xstate'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {useToolOptions} from '../../contexts/ToolOptionsContext'
import {getAssetFormSchema} from '../../formSchema'
import useVersionedClient from '../../hooks/useVersionedClient'
import {confirmDeleteAssetsDialog, folderMoveDialog} from '../../machines/dialogs'
import {selectFolderPath} from '../../machines/foldersMachine'
import {selectIsCreatingTag, selectTags} from '../../machines/tagsMachine'
import type {
  Asset,
  AssetFormData,
  DialogAssetEditProps,
  TagItem,
  TagSelectOption,
} from '../../types'
import getTagSelectOptions from '../../utils/getTagSelectOptions'
import {getUniqueDocuments} from '../../utils/getUniqueDocuments'
import imageDprUrl from '../../utils/imageDprUrl'
import sanitizeFormData from '../../utils/sanitizeFormData'
import {isFileAsset, isImageAsset} from '../../utils/typeGuards'
import zodFormResolver from '../../utils/zodFormResolver'
import AssetMetadata from '../AssetMetadata'
import Dialog from '../Dialog'
import DocumentList from '../DocumentList'
import FileAssetPreview from '../FileAssetPreview'
import FormSubmitButton from '../FormSubmitButton'
import Image from '../Image'
import Details, {type DetailsProps} from './Details'

function renderDefaultDetails(props: DetailsProps) {
  return <Details {...props} />
}

type Props = {
  children: ReactNode
  dialog: DialogAssetEditProps
}

/** Options for the asset's tags, skipping references to tags that no longer exist. */
function getAssetTagOptions(
  asset: Asset | undefined,
  tagsById: Record<string, TagItem>,
): TagSelectOption[] | null {
  const tagItems = asset?.opt?.media?.tags?.flatMap((reference) => {
    const tagItem = tagsById[reference._ref]
    return tagItem ? [tagItem] : []
  })
  return tagItems?.length ? getTagSelectOptions(tagItems) : null
}

const DialogAssetEdit = (props: Props) => {
  const {
    children,
    dialog: {assetId, id},
  } = props

  const client = useVersionedClient()
  const scheme = useColorSchemeValue()

  const documentStore = useDocumentStore()

  const {assets, dialogs, folders, tags} = useMediaActors()
  const assetItem = useSelector(assets, (snapshot) =>
    assetId ? snapshot.context.byIds[assetId] : undefined,
  )
  const tagItems = useSelector(tags, selectTags)
  const tagsById = useSelector(tags, (snapshot) => snapshot.context.byIds)

  // Keep showing the last known version of the asset if it is deleted elsewhere
  const [lastKnownAsset, setLastKnownAsset] = useState(assetItem?.asset)
  if (assetItem && assetItem.asset !== lastKnownAsset) {
    setLastKnownAsset(assetItem.asset)
  }
  const [tabSection, setTabSection] = useState<'details' | 'references'>('details')

  const currentAsset = assetItem?.asset ?? lastKnownAsset
  const allTagOptions = getTagSelectOptions(tagItems)

  const assetTagOptions = useMemo(
    () => getAssetTagOptions(currentAsset, tagsById),
    [currentAsset, tagsById],
  )
  const currentFolderId = currentAsset?.opt?.media?.folder?._ref ?? null
  const currentFolderPath = useSelector(folders, (snapshot) =>
    selectFolderPath(snapshot, currentFolderId),
  )

  // Check if credit line options are configured
  const {creditLine, components: {details: CustomDetails} = {}, locales} = useToolOptions()

  const generateDefaultValues = useCallback(
    (asset?: Asset): AssetFormData => {
      let imageDescription: string | undefined
      if (asset && isImageAsset(asset)) {
        const raw = asset.metadata?.image?.['ImageDescription']
        if (typeof raw === 'string') {
          imageDescription = raw
        }
      }

      if (locales && locales.length > 0) {
        const makeLocaleObj = (field?: Record<string, string> | string, fallback = '') => {
          const obj: Record<string, string> = {}
          for (let i = 0; i < locales.length; i++) {
            const locale = locales[i]!
            // Prefer key presence over truthiness so an intentional empty string
            // (e.g. `{en: ''}`) is preserved and does not fall through to EXIF.
            if (typeof field === 'object' && field && locale.id in field) {
              obj[locale.id] = field[locale.id] ?? ''
            } else if (typeof field === 'string') {
              // Only populate the first locale to avoid spreading a legacy value
              // across all languages; the user should fill in other translations manually
              obj[locale.id] = i === 0 ? field : ''
            } else if (typeof field === 'object' && field) {
              // Localized object present but this locale key is missing: leave empty.
              // Do not apply EXIF fallback to partial translations.
              obj[locale.id] = ''
            } else {
              // No description set at all — EXIF fallback only for the first locale.
              obj[locale.id] = i === 0 ? fallback : ''
            }
          }
          return obj
        }
        return {
          altText: makeLocaleObj(asset?.altText),
          creditLine: makeLocaleObj(asset?.creditLine),
          description: makeLocaleObj(asset?.description, imageDescription),
          originalFilename: asset?.originalFilename || '',
          opt: {media: {tags: assetTagOptions}},
          title: makeLocaleObj(asset?.title),
        }
      }
      // Normalize: if a field is a localized object but locales are disabled, pick first non-empty value
      const flattenField = (field: unknown, fallback = ''): string => {
        if (typeof field === 'string') return field
        if (typeof field === 'object' && field !== null) {
          const values = Object.values(field as Record<string, string>)
          return values.find((v) => v) || fallback
        }
        return fallback
      }
      return {
        altText: flattenField(asset?.altText),
        creditLine: flattenField(asset?.creditLine),
        description: flattenField(asset?.description, imageDescription),
        originalFilename: asset?.originalFilename || '',
        opt: {media: {tags: assetTagOptions}},
        title: flattenField(asset?.title),
      }
    },
    [assetTagOptions, locales],
  )

  const values = useMemo(
    () => generateDefaultValues(currentAsset),
    [currentAsset, generateDefaultValues],
  )

  const {control, getValues, handleSubmit, register, setValue} = useForm<AssetFormData>({
    mode: 'onChange',
    // Changes made elsewhere (and tags resolving once loaded) only replace untouched fields
    resetOptions: {keepDirtyValues: true},
    resolver: zodFormResolver<AssetFormData>(getAssetFormSchema(locales)),
    values,
  })

  // Subscribe via useFormState so React Compiler cannot skip formState Proxy reads
  // that gate the Save button (isDirty / isValid).
  const {errors, isDirty, isValid} = useFormState({control})

  const formUpdating = !assetItem || assetItem?.updating

  const handleClose = () => {
    dialogs.send({type: 'dialog.close', id})
  }

  const handleDelete = () => {
    if (!assetItem) {
      return
    }

    dialogs.send({type: 'dialog.open', dialog: confirmDeleteAssetsDialog([assetItem], id)})
  }

  // Creates the tag, then selects it in this form
  const handleCreateTag = async (tagName: string) => {
    const existingTagIds = new Set(tags.getSnapshot().context.allIds)
    tags.send({type: 'tag.create', name: tagName})
    try {
      const snapshot = await waitFor(tags, (tagsSnapshot) => !selectIsCreatingTag(tagsSnapshot))
      const createdTag = selectTags(snapshot).find(
        (tagItem) => tagItem.tag.name.current === tagName && !existingTagIds.has(tagItem.tag._id),
      )?.tag
      if (createdTag) {
        const selectedTags = (getValues('opt.media.tags') as TagSelectOption[] | null) ?? []
        setValue(
          'opt.media.tags',
          [...selectedTags, {label: createdTag.name.current, value: createdTag._id}],
          {shouldDirty: true},
        )
      }
    } catch {
      // The browser was closed before the tag was created
    }
  }

  const handleChangeFolder = () => {
    if (!assetItem) {
      return
    }

    dialogs.send({type: 'dialog.open', dialog: folderMoveDialog([assetItem], currentFolderId)})
  }

  const handleRemoveFolder = () => {
    if (!assetItem || !currentFolderId) {
      return
    }

    assets.send({type: 'assets.folder.set', assets: [assetItem], folderId: null})
  }

  // Detect if asset has localized fields (objects) with keys not in the configured locales
  const hasOrphanedLocales = useMemo(() => {
    if (!currentAsset) return false
    const isLocaleObj = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)
    const fields = [
      currentAsset.title,
      currentAsset.altText,
      currentAsset.description,
      ...(currentAsset._type === 'sanity.imageAsset' ? [currentAsset.creditLine] : []),
    ]
    const anyLocalized = fields.some((f) => isLocaleObj(f))
    if (!anyLocalized) return false
    if (!locales || locales.length === 0) return true
    const configuredIds = new Set(locales.map((l) => l.id))
    return fields.some((f) => {
      if (!isLocaleObj(f)) return false
      return Object.keys(f as object).some((k) => !configuredIds.has(k))
    })
  }, [currentAsset, locales])

  const handleCleanupLocales = useCallback(async () => {
    if (!currentAsset) return

    const cleanField = (field: unknown): unknown => {
      if (typeof field !== 'object' || field === null || Array.isArray(field)) return field
      const obj = field as Record<string, string>
      if (!locales || locales.length === 0) {
        // Pick the first non-empty value sorted by key for determinism
        const sorted = Object.keys(obj).sort()
        return sorted.map((k) => obj[k]).find((v) => v) || ''
      }
      const configuredIds = new Set(locales.map((l) => l.id))
      const cleaned: Record<string, string> = {}
      for (const [key, val] of Object.entries(obj)) {
        if (configuredIds.has(key)) cleaned[key] = val
      }
      return cleaned
    }

    await client
      .patch(currentAsset._id)
      .set({
        title: cleanField(currentAsset.title),
        altText: cleanField(currentAsset.altText),
        description: cleanField(currentAsset.description),
        ...(currentAsset._type === 'sanity.imageAsset' && {
          creditLine: cleanField(currentAsset.creditLine),
        }),
      })
      .commit()
  }, [client, currentAsset, locales])

  // Submit react-hook-form
  const onSubmit: SubmitHandler<AssetFormData> = (formData) => {
    if (!assetItem) {
      return
    }

    const sanitizedFormData = sanitizeFormData(formData)

    // Keep an intentionally cleared description as '' (not null) so the EXIF
    // ImageDescription fallback does not refill it the next time the dialog opens.
    if (formData.description === '') {
      sanitizedFormData['description'] = ''
    }

    assets.send({
      type: 'asset.update',
      asset: assetItem.asset,
      closeDialogId: id,
      formData: {
        ...sanitizedFormData,
        // Map tags to sanity references
        opt: {
          media: {
            ...sanitizedFormData['opt'].media,
            tags:
              sanitizedFormData['opt'].media.tags
                // Tags deleted while the dialog was open
                ?.filter((tag: TagSelectOption) => tag.value in tagsById)
                .map((tag: TagSelectOption) => ({
                  _ref: tag.value,
                  _type: 'reference',
                  _weak: true,
                })) || null,
            // Preserve the folder reference — it is managed separately and must
            // not be wiped when patching opt.media via .set().
            ...(currentAsset?.opt?.media?.folder && {folder: currentAsset.opt.media.folder}),
          },
        },
      },
    })
  }

  const footer = (
    <Box padding={3}>
      <Stack gap={3}>
        {hasOrphanedLocales && (
          <Card padding={3} radius={2} shadow={1} tone="caution">
            <Flex align="center" justify="space-between" gap={3}>
              <Text size={1}>
                This asset has localized fields that are no longer configured. Clean them up to
                avoid validation errors.
              </Text>
              <Button
                fontSize={1}
                mode="ghost"
                onClick={handleCleanupLocales}
                text="Cleanup localized fields"
                tone="caution"
              />
            </Flex>
          </Card>
        )}
        <Flex justify="space-between">
          {/* Delete button */}
          <Button
            disabled={formUpdating}
            fontSize={1}
            mode="bleed"
            onClick={handleDelete}
            text="Delete"
            tone="critical"
          />

          {/* Submit button */}
          <FormSubmitButton
            disabled={formUpdating || !isDirty || !isValid || hasOrphanedLocales}
            isValid={isValid}
            lastUpdated={currentAsset?._updatedAt}
            onClick={handleSubmit(onSubmit)}
          />
        </Flex>
      </Stack>
    </Box>
  )

  if (!currentAsset) {
    return null
  }

  const detailsProps = {
    control,
    errors,
    formUpdating,
    register,
    setValue,
    assetTagOptions,
    allTagOptions,
    handleCreateTag,
    currentAsset,
    folderPath: currentFolderPath,
    folderMissing: !!currentFolderId && !currentFolderPath,
    onChangeFolder: handleChangeFolder,
    onRemoveFolder: handleRemoveFolder,
    creditLine,
    locales,
  }

  return (
    <Dialog animate footer={footer} header="Asset details" id={id} onClose={handleClose} width={3}>
      {/*
        We reverse direction to ensure the download button doesn't appear (in the DOM) before other tabbable items.
        This ensures that the dialog doesn't scroll down to the download button (which on smaller screens, can sometimes
        be below the fold).
      */}
      <Flex direction={['column-reverse', 'column-reverse', 'row-reverse']}>
        <Box flex={1} marginTop={[5, 5, 0]} padding={4}>
          <WithReferringDocuments // oxlint-disable-line no-deprecated -- deferred to a follow-up PR
            // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
            documentStore={documentStore}
            id={currentAsset._id}
          >
            {({isLoading, referringDocuments}) => {
              const uniqueReferringDocuments = getUniqueDocuments(referringDocuments)
              return (
                <>
                  {/* Tabs */}
                  <TabList gap={2}>
                    <Tab
                      aria-controls="details-panel"
                      disabled={formUpdating}
                      id="details-tab"
                      label="Details"
                      onClick={() => setTabSection('details')}
                      selected={tabSection === 'details'}
                      size={2}
                    />
                    <Tab
                      aria-controls="references-panel"
                      disabled={formUpdating}
                      id="references-tab"
                      label={`References${
                        !isLoading && Array.isArray(uniqueReferringDocuments)
                          ? ` (${uniqueReferringDocuments.length})`
                          : ''
                      }`}
                      onClick={() => setTabSection('references')}
                      selected={tabSection === 'references'}
                      size={2}
                    />
                  </TabList>

                  {/* Form fields */}
                  <Box as="form" marginTop={4} onSubmit={handleSubmit(onSubmit)}>
                    {/* Deleted notification */}
                    {!assetItem && (
                      <Card marginBottom={3} padding={3} radius={2} shadow={1} tone="critical">
                        <Text size={1}>This file cannot be found – it may have been deleted.</Text>
                      </Card>
                    )}

                    {/* Hidden button to enable enter key submissions */}
                    <button style={{display: 'none'}} tabIndex={-1} type="submit" />

                    {/* Panel: details */}
                    <TabPanel
                      aria-labelledby="details"
                      hidden={tabSection !== 'details'}
                      id="details-panel"
                    >
                      {CustomDetails ? (
                        <CustomDetails
                          {...detailsProps}
                          renderDefaultDetails={renderDefaultDetails}
                        />
                      ) : (
                        <Details {...detailsProps} />
                      )}
                    </TabPanel>

                    {/* Panel: References */}
                    <TabPanel
                      aria-labelledby="references"
                      hidden={tabSection !== 'references'}
                      id="references-panel"
                    >
                      <Box marginTop={5}>
                        {assetItem?.asset && (
                          <DocumentList
                            documents={uniqueReferringDocuments}
                            isLoading={isLoading}
                          />
                        )}
                      </Box>
                    </TabPanel>
                  </Box>
                </>
              )
            }}
          </WithReferringDocuments>
        </Box>

        <Box flex={1} padding={4}>
          <Box style={{aspectRatio: '1'}}>
            {/* File */}
            {isFileAsset(currentAsset) && <FileAssetPreview asset={currentAsset} />}

            {/* Image */}
            {isImageAsset(currentAsset) && (
              <Image
                draggable={false}
                $scheme={scheme}
                $showCheckerboard={!currentAsset?.metadata?.isOpaque}
                src={imageDprUrl(currentAsset, {height: 600, width: 600})}
              />
            )}
          </Box>

          {/* Metadata */}
          {currentAsset && (
            <Box marginTop={4}>
              <AssetMetadata asset={currentAsset} item={assetItem} />
            </Box>
          )}
        </Box>
      </Flex>

      {children}
    </Dialog>
  )
}

export default DialogAssetEdit
