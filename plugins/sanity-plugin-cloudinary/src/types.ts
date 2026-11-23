import type {CloudinaryAssetDerived} from './schema/cloudinaryAssetDerived'

export type CloudinaryDerivative = {
  url: string
  secure_url: string
  raw_transformation: string
}

export type CloudinaryAssetResponse = {
  public_id: string
  id?: string
  resource_type: string
  type: string
  url: string
  tags: string[]
  secure_url: string
  format: string
  width: number
  height: number
  bytes: number
  context?: {
    custom: Record<string, string>
  }
  derived?: CloudinaryDerivative[]
}

export type InsertHandlerParams = {
  assets: CloudinaryAssetResponse[]
}

export type ShowHandlerParams = {
  isOpen: boolean
}

export interface CloudinaryMediaLibrary {
  show: (config?: {asset: any; folder: any}) => void
  hide: () => void
}

export type CloudinaryAsset = {
  _type: string
  _key?: string
  _version: number
  id?: string
  public_id: string
  resource_type: string
  type: string
  format: string
  version: number
  url: string
  secure_url: string
  width: number
  height: number
  derived?: CloudinaryAssetDerived[]
  display_name?: string
}

/**
 * Opt-in settings for how video assets play in Studio previews and diffs. Each setting is
 * off when left unset, and with none of them set the preview plays the stored URL exactly
 * as before.
 *
 * Only public `upload` videos without a Media Library derived transformation are changed;
 * signed URLs, private or authenticated assets, and derived videos always play as stored.
 * @public
 */
export interface CloudinaryVideoPreviewOptions {
  /**
   * Cloudinary transformation applied to the preview playback URL, for example
   * `'q_auto,w_640'` to play a small copy instead of the original.
   *
   * Cloudinary generates the transformed video the first time it is requested, and that
   * counts toward your plan's transformation usage. It pays off when previews are played
   * more than once or originals are large. If Cloudinary rejects the transformation (for
   * example, because the original exceeds your plan's on-the-fly video size limit), the
   * player falls back to the stored URL.
   */
  transformation?: string
  /**
   * `preload` attribute for the preview `<video>` element. `'none'` loads nothing until the
   * editor presses play. Unset leaves the browser default.
   */
  preload?: 'none' | 'metadata' | 'auto'
  /**
   * Show a still of the first frame (`so_0`, with `transformation` applied if set) before
   * playback. Useful together with `preload: 'none'`, which otherwise shows an empty player.
   * Generates one image per video.
   */
  poster?: boolean
}

/**
 * Options for `cloudinarySchemaPlugin` and `cloudinaryReferencePlugin`.
 * @public
 */
export interface CloudinaryPluginConfig {
  videoPreview?: CloudinaryVideoPreviewOptions
}

export type AssetDocument = {
  _id: string
  label?: string
  title?: string
  description?: string
  source?: {
    id: string
    name: string
    url?: string
  }
  creditLine?: string
  originalFilename?: string
}

declare global {
  interface Window {
    // Only defined after the Cloudinary Media Library widget script has loaded.
    cloudinary?: {
      openMediaLibrary: (config: any, callbacks: any) => void
      createMediaLibrary: (config: any, callbacks?: any) => CloudinaryMediaLibrary
    }
  }
}
