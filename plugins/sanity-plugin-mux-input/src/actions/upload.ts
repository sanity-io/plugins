import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, EMPTY, from, type Observable, of, throwError} from 'rxjs'
import {catchError, ignoreElements, map, mergeMap, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {createUpChunkObservable} from '../clients/upChunkObservable'
import {formatDriveShareLink} from '../util/formatDriveShareLink'
import {getMuxAddonClient} from '../util/muxAddonClient'
import {PLUGIN_VERSION_QUERY} from '../util/pluginVersion'
import {type BackoffSchedule, retryWithBackoff} from '../util/retryWithBackoff'
import {roundPxString} from '../util/roundPxString'
import type {MuxAsset, MuxNewAssetSettings, WatermarkConfig} from '../util/types'
import {isRetryablePollError, toUploadError} from '../util/uploadErrors'
import {getAsset} from './assets'

/**
 * API version for the upload requests. From this version on, a new upload can
 * take a moment to become available (the API answers 404 until then), and
 * retrying is up to the plugin: see `pollUpload` and `cancelUpload`. Other
 * requests keep the plugin's default API version.
 */
const UPLOAD_API_VERSION = '2026-11-03'

/**
 * How `pollUpload` waits for a finished upload to become an asset. The first
 * poll waits a moment, since the upload is rarely available right away, then
 * the waits double up to a cap until the overall limit.
 */
const POLL_SCHEDULE: BackoffSchedule = {
  firstDelayMs: 200,
  retryDelayMs: 200,
  maxDelayMs: 4_000,
  timeoutMs: 30_000,
}

/**
 * How `cancelUpload` retries when the upload isn't available yet. Cancelling
 * is best effort, so it gives up after a few seconds.
 */
const CANCEL_SCHEDULE: BackoffSchedule = {
  firstDelayMs: 0,
  retryDelayMs: 200,
  maxDelayMs: 1_000,
  timeoutMs: 5_000,
}

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

function isNotFoundError(error: unknown): boolean {
  return (error as {statusCode?: unknown} | null)?.statusCode === 404
}

/**
 * Deletes an upload on Mux, along with its asset document. Retries while the
 * API answers 404, which it can do right after the upload is created. Never
 * fails: if the upload still can't be deleted, it gives up quietly.
 */
export function cancelUpload(client: SanityClient, uuid: string): Observable<never> {
  const {dataset} = client.config()
  return retryWithBackoff(
    () =>
      getUploadClient(client).observable.request({
        url: `/addons/mux/uploads/${dataset}/${uuid}`,
        withCredentials: true,
        method: 'DELETE',
        query: PLUGIN_VERSION_QUERY,
        // Retrying is done here, so turn off the client's own retries.
        maxRetries: 0,
      }),
    {
      ...CANCEL_SCHEDULE,
      isRetryableError: isNotFoundError,
      timeoutError: () => new Error('Could not cancel the upload'),
    },
  ).pipe(
    ignoreElements(),
    catchError(() => EMPTY),
  )
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
                    return updateAssetDocumentFromUpload(client, uuid, watermark, file.name).pipe(
                      map((doc) => ({...event, asset: doc})),
                    )
                  }),
                  catchError((err) => {
                    // Delete the upload and its asset document, then report the original error
                    return concat(
                      cancelUpload(client, uuid),
                      throwError(() => err),
                    )
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
function getUpload(client: SanityClient, uuid: string) {
  const {dataset} = client.config()
  return getUploadClient(client).observable.request<UploadResponse>({
    url: `/addons/mux/uploads/${dataset}/${uuid}`,
    withCredentials: true,
    method: 'GET',
    query: PLUGIN_VERSION_QUERY,
    // Retrying is done by `pollUpload`, so turn off the client's own retries.
    maxRetries: 0,
  })
}

/** The upload exists, but Mux hasn't created its asset yet. */
class UploadNotReadyError extends Error {
  constructor() {
    super('Upload is not ready yet')
    this.name = 'UploadNotReadyError'
  }
}

function isRetryableUploadPollError(error: unknown): boolean {
  return error instanceof UploadNotReadyError || isRetryablePollError(error)
}

/**
 * Waits for Mux to turn the finished upload into an asset, polling on
 * `POLL_SCHEDULE`. Retries while the upload has no asset yet, and on the
 * errors `isRetryablePollError` accepts, such as the 404 the API answers
 * until a new upload is available.
 */
export function pollUpload(client: SanityClient, uuid: string): Observable<UploadResponse> {
  return retryWithBackoff(
    () =>
      getUpload(client, uuid).pipe(
        map((upload) => {
          if (!upload?.data?.asset_id) throw new UploadNotReadyError()
          return upload
        }),
      ),
    {
      ...POLL_SCHEDULE,
      isRetryableError: isRetryableUploadPollError,
      timeoutError: () => new Error('Upload did not finish'),
    },
  )
}

function updateAssetDocumentFromUpload(
  client: SanityClient,
  uuid: string,
  _watermark?: WatermarkConfig,
  filename?: string,
) {
  return pollUpload(client, uuid).pipe(
    mergeMap((upload) =>
      from(getAsset(client, upload.data.asset_id)).pipe(
        map((asset: {data: MuxAsset}) => ({
          status: asset.data.status,
          data: asset.data,
          assetId: asset.data.id,
          playbackId: asset.data.playback_ids[0]?.id,
          uploadId: upload.data.id,
        })),
      ),
    ),
    mergeMap((fields) =>
      from(
        uploadedAssetTransaction(client, uuid, fields, filename).commit({returnDocuments: false}),
      ).pipe(map(() => ({_id: uuid, _type: 'mux.videoAsset' as const, ...fields}))),
    ),
  )
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
