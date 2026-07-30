import type {
  CloudinaryAsset,
  CloudinaryAssetResponse,
  CloudinaryMediaLibrary,
  InsertHandlerParams,
  ShowHandlerParams,
} from './types'

const widgetSrc = 'https://media-library.cloudinary.com/global/all.js'

export function assetUrl(asset: Partial<Pick<CloudinaryAsset, 'url' | 'secure_url' | 'derived'>>) {
  const [derived] = asset.derived ?? []
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

/**
 * Normalize a Media Library payload into a shape that matches the `cloudinary.asset`
 * schema: drop nulls, sanitize context keys, and tag derived items with `_type`.
 */
export function normalizeCloudinaryAsset(asset: CloudinaryAssetResponse): Record<string, unknown> {
  const assetWithoutNulls = Object.fromEntries(
    Object.entries(asset).filter(([_, assetValue]) => assetValue !== null),
  ) as CloudinaryAssetResponse

  const requiredFields = {
    id: asset.id,
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

  let updatedAsset: Record<string, unknown> = {
    ...assetWithoutNulls,
    ...requiredFields,
  }

  // Sanity object keys cannot contain special characters, so rename Cloudinary context keys
  if (asset.context) {
    const objectWithRenamedKeys = Object.fromEntries(
      Object.entries(asset.context.custom).map(([contextKey, contextValue]) => {
        return [contextKey.replace(/[^a-zA-Z0-9_]|-/g, '_'), contextValue]
      }),
    )

    updatedAsset = {
      ...updatedAsset,
      context: {
        ...asset.context,
        custom: objectWithRenamedKeys,
      },
    }
  }

  if (asset.derived) {
    updatedAsset = {
      ...updatedAsset,
      derived: asset.derived.map((derivedItem) => ({
        _type: 'derived',
        url: derivedItem.url,
        secure_url: derivedItem.secure_url,
        raw_transformation: derivedItem.raw_transformation,
      })),
    }
  }

  return updatedAsset
}

export const openMediaSelector = (
  cloudName: string,
  apiKey: string,
  multiple: boolean,
  insertHandler: (params: InsertHandlerParams) => void,
  selectedAsset?: CloudinaryAsset,
  showHandler?: (params: ShowHandlerParams) => void,
  folder?: {resource_type?: 'image' | 'video'; path?: string},
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

    if (folder?.path || folder?.resource_type) {
      options['folder'] = {
        ...(folder.path ? {path: folder.path} : {}),
        ...(folder.resource_type ? {resource_type: folder.resource_type} : {}),
      }
    }

    const callbacks: {
      insertHandler: (params: InsertHandlerParams) => void
      showHandler?: (params: ShowHandlerParams) => void
    } = {insertHandler}

    if (showHandler) {
      callbacks.showHandler = showHandler
    }

    window.cloudinary.openMediaLibrary(options, callbacks)
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
