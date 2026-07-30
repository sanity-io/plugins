import {CloudConfig, CloudinaryImage} from '@cloudinary/url-gen'
import {scale} from '@cloudinary/url-gen/actions/resize'

import type {
  CloudinaryAsset,
  CloudinaryAssetResponse,
  CloudinaryMediaLibrary,
  InsertHandlerParams,
} from './types'

const widgetSrc = 'https://media-library.cloudinary.com/global/all.js'

export function assetUrl(
  asset: Partial<
    Pick<
      CloudinaryAsset,
      'url' | 'secure_url' | 'derived' | 'public_id' | 'format' | 'resource_type' | 'type'
    >
  >,
  cloudName?: string,
): string | undefined {
  const [derived] = asset.derived ?? []

  // When the cloud name and public id are known and there is no Media Library
  // derived transform, build an on-the-fly preview with url-gen instead of
  // serving the full-size original. Scaling to a 400px width keeps previews
  // crisp while avoiding multi-megabyte source downloads.
  // Only public `upload` images use CloudinaryImage — video/raw would get an
  // /image/upload URL that breaks VideoPlayer/raw previews, and private or
  // authenticated assets need their stored (often signed) URL rather than an
  // unsigned /upload/ path. Derived transforms are preferred over the scaled
  // original so Studio still shows the editor's chosen crop/effects.
  if (
    cloudName &&
    asset.public_id &&
    !derived &&
    asset.resource_type !== 'video' &&
    asset.resource_type !== 'raw' &&
    (!asset.type || asset.type === 'upload')
  ) {
    return new CloudinaryImage(asset.public_id, new CloudConfig({cloudName}))
      .resize(scale().width(400))
      .toURL()
  }

  if (derived) {
    if (derived.secure_url) {
      return derived.secure_url
    }
    return derived.url
  }
  if (asset.secure_url) {
    return asset.secure_url
  }
  return asset.url
}

export const openMediaSelector = (
  cloudName: string,
  apiKey: string,
  multiple: boolean,
  insertHandler: (params: InsertHandlerParams) => void,
  selectedAsset?: CloudinaryAsset,
) => {
  loadJS(widgetSrc, () => {
    const options: Record<string, any> = {
      cloud_name: cloudName,
      api_key: apiKey,
      insert_caption: 'Select',
      multiple,
    }

    if (selectedAsset) {
      options['asset'] = {
        public_id: selectedAsset.public_id,
        type: selectedAsset.type,
        resource_type: selectedAsset.resource_type,
      }
    }

    window.cloudinary.openMediaLibrary(options, {insertHandler})
  })
}

export const createMediaLibrary = ({
  cloudName,
  apiKey,
  inlineContainer,
  libraryCreated,
  insertHandler,
}: {
  cloudName: string
  apiKey: string
  inlineContainer: string
  libraryCreated: (library: CloudinaryMediaLibrary) => void
  insertHandler: (params: InsertHandlerParams) => void
}) => {
  loadJS(widgetSrc, () => {
    const options: Record<string, any> = {
      cloud_name: cloudName,
      api_key: apiKey,
      insert_caption: 'Select',
      inline_container: inlineContainer,
      remove_header: true,
    }

    libraryCreated(window.cloudinary.createMediaLibrary(options, {insertHandler}))
  })
}

function loadJS(url: string, callback: () => void) {
  const existingScript = document.getElementById('damWidget')
  if (!existingScript) {
    const script = document.createElement('script')
    script.src = url
    script.id = 'damWidget'
    document.body.appendChild(script)
    script.addEventListener('load', () => {
      callback()
    })
  }
  if (existingScript && callback) {
    return callback()
  }
  return true
}

export function encodeSourceId(asset: CloudinaryAssetResponse): string {
  const {resource_type, public_id, type} = asset
  return btoa(JSON.stringify({public_id, resource_type, type})) // Sort keys alphabetically!
}

export function encodeFilename(asset: CloudinaryAssetResponse) {
  return `${asset.public_id.split('/').slice(-1)[0]}.${asset.format}`
}

export function decodeSourceId(sourceId: string): CloudinaryAssetResponse | undefined {
  let sourceIdDecoded: any
  try {
    sourceIdDecoded = JSON.parse(atob(sourceId))
  } catch {
    // Do nothing
  }
  return sourceIdDecoded
}
