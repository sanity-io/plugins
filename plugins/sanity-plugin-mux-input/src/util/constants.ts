export const name = 'mux-input' as const

// Caching namespace, as suspend-react might be in use by other components on the page we must ensure we don't collide
export const cacheNs = 'sanity-plugin-mux-input' as const

export const muxSecretsDocumentId = 'secrets.mux' as const

export const DIALOGS_Z_INDEX = 60_000

/** Mux guide explaining the mezzanine ("master access") file and how it differs from MP4 renditions. */
export const MEZZANINE_LEARN_MORE_URL =
  'https://www.mux.com/docs/guides/download-for-offline-editing#enable-master-access'

export const THUMBNAIL_ASPECT_RATIO = 16 / 9

/** To prevent excessive height, thumbnails and input should not go beyond to this aspect ratio. */
export const MIN_ASPECT_RATIO = 5 / 4

export const AUDIO_ASPECT_RATIO = 5 / 1
