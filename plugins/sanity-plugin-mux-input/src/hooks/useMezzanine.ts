import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {getAsset, updateMasterAccess} from '../actions/assets'
import {addKeysToMuxData} from '../util/addKeysToMuxData'
import type {MuxAsset, VideoAssetDocument} from '../util/types'
import {useClient} from './useClient'

/**
 * UI status for the mezzanine ("master access") file of a Mux asset, derived
 * solely from the stored `master` object.
 * - `disabled`: master access is not enabled (or reverted to `none`).
 * - `preparing`: Mux is preparing the file (we poll until it's ready).
 * - `ready`: the file is ready to download.
 * - `errored`: Mux failed to prepare the file.
 */
export type MezzanineStatus = 'disabled' | 'preparing' | 'ready' | 'errored'

// Poll cadence while the mezzanine is preparing.
const POLL_INTERVAL_MS = 3000

export interface UseMezzanineReturn {
  status: MezzanineStatus
  /** `true` while an enable or pre-download check request is in flight. */
  busy: boolean
  /**
   * `true` when the last download attempt found the file gone (the 24h window
   * elapsed). Used to show a "enable it again" hint; the button state still
   * comes from `status`.
   */
  expired: boolean
  /** Mezzanine resolution label (e.g. `1080p`), when known. */
  resolution?: string
  /** Enables master access and starts polling until the file is ready. */
  enable: () => Promise<void>
  /** Re-fetches the asset and, if the file is still alive, triggers the download. */
  download: () => Promise<void>
}

/** Derives the mezzanine status from the persisted asset data alone (no polling or local state). */
export function getMezzanineStatus(
  asset: VideoAssetDocument,
): 'disabled' | 'preparing' | 'ready' | 'errored' {
  const master = asset.data?.master
  if (master?.status === 'preparing') return 'preparing'
  if (master?.status === 'ready' && master.url) return 'ready'
  if (master?.status === 'errored') return 'errored'
  return 'disabled'
}

/**
 * Encapsulates the mezzanine (Mux "master access") lifecycle for an asset:
 * enabling it through the Mux addon proxy, persisting the result on the Sanity
 * document, polling until it's ready, and downloading by redirecting to the
 * fresh, short-lived Mux URL.
 *
 * The full Mux asset `data` (including the `master` object) is stored on the
 * Sanity document via `client.patch`, so the status survives reloads and is
 * already present for assets imported from Mux.
 */
export function useMezzanine(asset: VideoAssetDocument): UseMezzanineReturn {
  const client = useClient()
  const toast = useToast()

  const master = asset.data?.master
  const [busy, setBusy] = useState(false)
  const [expired, setExpired] = useState(false)

  const resolution = useMemo(
    () => asset.data?.max_resolution_tier || asset.data?.max_stored_resolution || undefined,
    [asset.data?.max_resolution_tier, asset.data?.max_stored_resolution],
  )

  const status: MezzanineStatus = useMemo(
    () => getMezzanineStatus(asset),
    [master?.status, master?.url],
  )

  // Fetch the latest asset from Mux (through the proxy) and persist it on the Sanity document.
  const refresh = useCallback(async (): Promise<MuxAsset | undefined> => {
    if (!asset.assetId || !asset._id) return undefined
    const {data} = await getAsset(client, asset.assetId)
    await client
      .patch(asset._id)
      .set({status: data.status, data: addKeysToMuxData(data)})
      .commit({returnDocuments: false})
    return data
  }, [asset.assetId, asset._id, client])

  // Poll while the mezzanine is preparing; stop once it's ready or no longer preparing.
  useEffect(() => {
    if (master?.status !== 'preparing' || !asset.assetId || !asset._id) return undefined

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const data = await refresh()
        if (cancelled) return
        if (!data || data.master?.status !== 'preparing') {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Failed to poll mezzanine status:', error)
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [master?.status, asset.assetId, asset._id, refresh])

  const enable = useCallback(async () => {
    if (!asset.assetId || !asset._id) return

    setBusy(true)
    setExpired(false)
    try {
      await updateMasterAccess(client, asset.assetId, 'temporary')
      // Persist the updated asset (master.status === 'preparing') so polling kicks in.
      await refresh()
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Could not enable the mezzanine file',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setBusy(false)
    }
  }, [asset.assetId, asset._id, client, refresh, toast])

  const download = useCallback(async () => {
    if (!asset.assetId) return

    setBusy(true)
    try {
      // The Mux URL is short-lived (24h), so re-fetch the asset right before
      // downloading and only redirect if the file is still alive.
      const data = await refresh()
      const url = data?.master?.status === 'ready' ? data.master.url : undefined

      if (url) {
        setExpired(false)
        triggerMezzanineDownload(url)
      } else {
        // The window elapsed and master_access reverted: prompt to re-enable.
        setExpired(true)
      }
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Could not download the mezzanine file',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setBusy(false)
    }
  }, [asset.assetId, refresh, toast])

  return {status, busy, expired, resolution, enable, download}
}

/**
 * Redirects the browser to the Mux mezzanine URL to start the download. The URL
 * already serves the file with its default name (`mezzanine.mp4`).
 * @see {@link https://www.mux.com/docs/guides/download-for-offline-editing}
 */
function triggerMezzanineDownload(masterUrl: string): void {
  if (typeof window === 'undefined') return

  const anchor = document.createElement('a')
  anchor.href = masterUrl
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
