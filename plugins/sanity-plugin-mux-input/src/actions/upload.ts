import {uuid as generateUuid} from '@sanity/uuid'
import {
  concat,
  connect,
  defer,
  EMPTY,
  from,
  materialize,
  merge,
  type Observable,
  of,
  takeUntil,
  throwError,
  timeout,
  timer,
} from 'rxjs'
import {catchError, ignoreElements, map, mergeMap, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {createUpChunkObservable} from '../clients/upChunkObservable'
import {formatDriveShareLink} from '../util/formatDriveShareLink'
import {getMuxAddonClient} from '../util/muxAddonClient'
import {PLUGIN_VERSION_QUERY} from '../util/pluginVersion'
import {backoffDelay, type BackoffSchedule, retryWithBackoff} from '../util/retryWithBackoff'
import {roundPxString} from '../util/roundPxString'
import type {MuxAsset, MuxNewAssetSettings, WatermarkConfig} from '../util/types'
import {isUnavailableError, toUploadError} from '../util/uploadErrors'
import {getAsset} from './assets'

/** The first poll waits briefly, since the asset is rarely ready right away. */
const POLL_SCHEDULE: BackoffSchedule = {
  firstDelayMs: 200,
  retryDelayMs: 200,
  maxDelayMs: 4_000,
  timeoutMs: 30_000,
}

/** Waits before each `pollUpload` retry on a 5xx or network error, then it fails. */
const UNAVAILABLE_RETRY_DELAYS_MS = [500, 1_000]

/**
 * After the file is sent, how long `uploadFile` waits for the asset before emitting
 * `processing`.
 */
const PROCESSING_NOTICE_DELAY_MS = 3_000

/** Cancelling is best effort, so `cancelUpload` stops waiting after this long. */
const CANCEL_TIMEOUT_MS = 5_000

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

/**
 * Deletes an upload and its asset document. Tries once and never fails: a 404 means there
 * is nothing to cancel.
 */
export function cancelUpload(client: SanityClient, uuid: string): Observable<never> {
  const {dataset} = client.config()
  return defer(() =>
    getMuxAddonClient(client).observable.request({
      url: `/addons/mux/uploads/${dataset}/${uuid}`,
      withCredentials: true,
      method: 'DELETE',
      query: PLUGIN_VERSION_QUERY,
      // Best effort, so no retries that would hold up the upload's own error.
      maxRetries: 0,
    }),
  ).pipe(
    timeout({first: CANCEL_TIMEOUT_MS}),
    ignoreElements(),
    catchError(() => EMPTY),
  )
}

/** Mirrors `work`, emitting `processing` first if it's silent for `PROCESSING_NOTICE_DELAY_MS`. */
export function withProcessingNotice<T>(work: Observable<T>): Observable<T | {type: 'processing'}> {
  return work.pipe(
    connect((shared) =>
      merge(
        timer(PROCESSING_NOTICE_DELAY_MS).pipe(
          map(() => ({type: 'processing' as const})),
          // `materialize` so an error or completion also cancels the notice.
          takeUntil(shared.pipe(materialize())),
        ),
        shared,
      ),
    ),
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
        // No credentials check first: this request fails on bad ones, and
        // toUploadError says whether they're missing or rejected.
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
            getMuxAddonClient(client).observable.request({
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
        // No credentials check first: this request fails on bad ones, and
        // toUploadError says whether they're missing or rejected.
        defer(() => {
          const uuid = generateUuid()
          const body = settings
          sanitizeOverlaySettingsInPlace(body)

          return concat(
            of({type: 'uuid' as const, uuid}),
            defer(() =>
              getMuxAddonClient(client).observable.request<{
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
                    return withProcessingNotice(
                      updateAssetDocumentFromUpload(client, uuid, watermark, file.name).pipe(
                        map((doc) => ({...event, asset: doc})),
                      ),
                    )
                  }),
                  catchError((err) => {
                    // Clean up the upload, then report the original error
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
  return getMuxAddonClient(client).observable.request<UploadResponse>({
    url: `/addons/mux/uploads/${dataset}/${uuid}`,
    withCredentials: true,
    method: 'GET',
    query: PLUGIN_VERSION_QUERY,
    // `pollUpload` retries, so the client's own retries would stack on ours.
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

/**
 * Retry delays for one `pollUpload`. A pending upload is polled with backoff until the
 * timeout, and a 5xx or network error is retried a couple of times. Anything else fails
 * straight away, including a 404: the upload's document is readable as soon as it's
 * created, so a 404 means it doesn't exist.
 */
function createPollRetryDelay(): (error: unknown, retryCount: number) => number | undefined {
  let unavailableRetries = 0

  return (error, retryCount) => {
    if (error instanceof UploadNotReadyError) return backoffDelay(retryCount, POLL_SCHEDULE)
    if (isUnavailableError(error)) return UNAVAILABLE_RETRY_DELAYS_MS[unavailableRetries++]
    return undefined
  }
}

/**
 * Waits for Mux to turn the finished upload into an asset, or fails with
 * "Upload did not finish".
 */
export function pollUpload(client: SanityClient, uuid: string): Observable<UploadResponse> {
  return defer(() =>
    retryWithBackoff(
      () =>
        getUpload(client, uuid).pipe(
          map((upload) => {
            if (!upload?.data?.asset_id) throw new UploadNotReadyError()
            return upload
          }),
        ),
      {
        ...POLL_SCHEDULE,
        retryDelay: createPollRetryDelay(),
        timeoutError: () => new Error('Upload did not finish'),
      },
    ),
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
