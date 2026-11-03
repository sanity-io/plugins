import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, from, type Observable, of, throwError} from 'rxjs'
import {catchError, mergeMap, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {createUpChunkObservable} from '../clients/upChunkObservable'
import {formatDriveShareLink} from '../util/formatDriveShareLink'
import {getMuxAddonClient} from '../util/muxAddonClient'
import {PLUGIN_VERSION_QUERY} from '../util/pluginVersion'
import {pollWithBackoff, PollTimeoutError} from '../util/pollWithBackoff'
import {roundPxString} from '../util/roundPxString'
import type {MuxAsset, MuxNewAssetSettings, WatermarkConfig} from '../util/types'
import {isRetryablePollError, toUploadError} from '../util/uploadErrors'
import {getAsset} from './assets'

/**
 * API version for the upload requests. From this version on, a new upload can
 * take a moment to become available, which `pollUpload` handles by retrying
 * 404s. Other requests keep the plugin's default API version.
 */
const UPLOAD_API_VERSION = '2026-11-03'

function getUploadClient(client: SanityClient): SanityClient {
  return getMuxAddonClient(client).withConfig({apiVersion: UPLOAD_API_VERSION})
}

function sanitizeOverlaySettingsInPlace(settings: MuxNewAssetSettings) {
  const inputs = settings.input
  if (!inputs) return
  for (const input of inputs) {
    const overlay = (input as {overlay_settings?: Record<string, unknown>}).overlay_settings
    if (!overlay) continue

    const hm = roundPxString(overlay['horizontal_margin'])
    const vm = roundPxString(overlay['vertical_margin'])
    const w = roundPxString(overlay['width'])

    if (hm) overlay['horizontal_margin'] = hm
    if (vm) overlay['vertical_margin'] = vm
    if (w) overlay['width'] = w
  }
}

function sanitizePxStringsInJson(json: string): string {
  return json.replace(/"(-?\d+(?:\.\d+)?)px"/g, (_match, num) => {
    const n = Number(num)
    if (!Number.isFinite(n)) return _match
    let rounded = Math.round(n)
    if (rounded === 0) rounded = n < 0 ? -1 : 1
    return `"${rounded}px"`
  })
}

function cancelUpload(client: SanityClient, uuid: string) {
  return getUploadClient(client).observable.request({
    url: `/addons/mux/uploads/${client.config().dataset}/${uuid}`,
    withCredentials: true,
    method: 'DELETE',
    query: PLUGIN_VERSION_QUERY,
  })
}

export function uploadUrl({
  url,
  settings,
  client,
}: {
  url: string
  settings: MuxNewAssetSettings
  client: SanityClient
  watermark?: WatermarkConfig
}) {
  return testUrl(url).pipe(
    switchMap((validUrl) => {
      return concat(
        of({type: 'url' as const, url: validUrl}),
        // No separate credentials check first: Mux rejects bad credentials on
        // the request itself, and toUploadError turns that into the same error.
        defer(() => {
          const uuid = generateUuid()
          const muxBody = settings
          if (!muxBody.input) muxBody.input = [{type: 'video'}]
          muxBody.input[0]!.url = validUrl
          sanitizeOverlaySettingsInPlace(muxBody)

          const query: Record<string, string> = {
            muxBody: sanitizePxStringsInJson(JSON.stringify(muxBody)),
          }
          const filename = validUrl.split('/').slice(-1)[0]
          if (filename) {
            query['filename'] = filename
          }

          const dataset = client.config().dataset
          return defer(() =>
            getUploadClient(client).observable.request({
              url: `/addons/mux/assets/${dataset}`,
              withCredentials: true,
              method: 'POST',
              headers: {
                'MUX-Proxy-UUID': uuid,
                'Content-Type': 'application/json',
              },
              query: {...query, ...PLUGIN_VERSION_QUERY},
            }),
          ).pipe(
            catchError((err) => throwError(() => toUploadError(err))),
            mergeMap((result) => {
              const asset =
                (result && result.results && result.results[0] && result.results[0].document) ||
                null

              if (!asset) {
                return throwError(() => new Error('No asset document returned'))
              }
              return of({type: 'success' as const, id: uuid, asset})
            }),
          )
        }),
      )
    }),
  )
}

export function uploadFile({
  settings,
  client,
  file,
  watermark,
}: {
  settings: MuxNewAssetSettings
  client: SanityClient
  file: File
  watermark?: WatermarkConfig
}) {
  return testFile(file).pipe(
    switchMap((fileOptions) => {
      return concat(
        of({type: 'file' as const, file: fileOptions}),
        // No separate credentials check first: Mux rejects bad credentials on
        // the request itself, and toUploadError turns that into the same error.
        defer(() => {
          const uuid = generateUuid()
          const body = settings
          sanitizeOverlaySettingsInPlace(body)

          return concat(
            of({type: 'uuid' as const, uuid}),
            defer(() =>
              getUploadClient(client).observable.request<{
                sanityAssetId: string
                upload: {
                  cors_origin: string
                  id: string
                  new_asset_settings: MuxNewAssetSettings
                  status: 'waiting'
                  timeout: number
                  url: string
                }
              }>({
                url: `/addons/mux/uploads/${client.config().dataset}`,
                withCredentials: true,
                method: 'POST',
                headers: {
                  'MUX-Proxy-UUID': uuid,
                  'Content-Type': 'application/json',
                },
                body,
                query: PLUGIN_VERSION_QUERY,
              }),
            ).pipe(
              catchError((err) => throwError(() => toUploadError(err))),
              mergeMap((result) => {
                return createUpChunkObservable(uuid, result.upload.url, file).pipe(
                  // @TODO type the observable events
                  mergeMap((event) => {
                    if (event.type !== 'success') {
                      return of(event)
                    }
                    return from(
                      updateAssetDocumentFromUpload(client, uuid, watermark, file.name),
                    ).pipe(mergeMap((doc) => of({...event, asset: doc})))
                  }),
                  catchError((err) => {
                    // Delete asset document
                    return cancelUpload(client, uuid).pipe(mergeMap(() => throwError(() => err)))
                  }),
                )
              }),
            ),
          )
        }),
      )
    }),
  )
}

type UploadResponse = {
  data: {
    asset_id: string
    cors_origin: string
    id: string
    new_asset_settings: {
      static_renditions?: {resolution: string}[]
      passthrough: string
      playback_policies: ['public' | 'signed' | 'drm']
    }
    status: string
    timeout: number
  }
}
function getUpload(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return getUploadClient(client).request<UploadResponse>({
    url: `/addons/mux/uploads/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'GET',
    query: PLUGIN_VERSION_QUERY,
  })
}

/**
 * Waits for Mux to turn the finished upload into an asset. Mux usually has the
 * asset ID by the first poll, so poll straight away, then back off (0.5s, 1s,
 * 2s, 4s, then every 8s) for up to 30s. A 404 is retried too, because the
 * upload can take a moment to become available after it's created.
 */
function pollUpload(client: SanityClient, uuid: string): Promise<UploadResponse> {
  return pollWithBackoff(
    async () => {
      const upload = await getUpload(client, uuid)
      return upload?.data?.asset_id ? upload : undefined
    },
    {isRetryableError: isRetryablePollError},
  ).catch((error: unknown) => {
    throw error instanceof PollTimeoutError ? new Error('Upload did not finish') : error
  })
}

async function updateAssetDocumentFromUpload(
  client: SanityClient,
  uuid: string,
  _watermark?: WatermarkConfig,
  filename?: string,
) {
  let upload: UploadResponse
  let asset: {data: MuxAsset}
  try {
    upload = await pollUpload(client, uuid)
  } catch (err) {
    return Promise.reject(err)
  }
  try {
    asset = await getAsset(client, upload.data.asset_id)
  } catch (err) {
    return Promise.reject(err)
  }

  const fields = {
    status: asset.data.status,
    data: asset.data,
    assetId: asset.data.id,
    playbackId: asset.data.playback_ids[0]?.id,
    uploadId: upload.data.id,
  }
  await uploadedAssetTransaction(client, uuid, fields, filename).commit({returnDocuments: false})
  return {_id: uuid, _type: 'mux.videoAsset', ...fields}
}

/**
 * Writes what a finished upload produced onto its asset document. A patch, not a replace, so
 * fields written since the upload was created (`filename`, Robots data) are kept. The uploaded
 * file's name only fills `filename` when nothing has been written there yet; without it the
 * video is listed under a slice of its Mux asset ID.
 */
export function uploadedAssetTransaction(
  client: Pick<SanityClient, 'transaction'>,
  uuid: string,
  fields: Record<string, unknown>,
  filename?: string,
) {
  return client
    .transaction()
    .createIfNotExists({_id: uuid, _type: 'mux.videoAsset'})
    .patch(uuid, (patch) => {
      const withFields = patch.set(fields)
      return filename ? withFields.setIfMissing({filename}) : withFields
    })
}

function testFile(file: File) {
  if (typeof window !== 'undefined' && file instanceof window.File) {
    const fileOptions = optionsFromFile({}, file)
    return of(fileOptions)
  }
  return throwError(() => new Error('Invalid file'))
}

function testUrl(url: string): Observable<string> {
  const error = new Error('Invalid URL')
  if (typeof url !== 'string') {
    return throwError(() => error)
  }
  let formattedUrl = url.trim()
  formattedUrl = formatDriveShareLink(formattedUrl)
  let parsed
  try {
    parsed = new URL(formattedUrl)
  } catch {
    return throwError(() => error)
  }
  if (parsed && !parsed.protocol.match(/http:|https:/)) {
    return throwError(() => error)
  }
  return of(formattedUrl)
}

function optionsFromFile(opts: {preserveFilename?: boolean}, file: File) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return undefined
  }
  return {
    name: opts.preserveFilename === false ? undefined : file.name,
    type: file.type,
  }
}
