// Sourced from:
// https://github.com/sanity-io/sanity/blob/ccb777e115a8cdf20d81a9a2bc9d8c228568faff/packages/%40sanity/form-builder/src/sanity/inputs/client-adapters/assets.ts

import type {SanityAssetDocument, SanityClient, SanityImageAssetDocument} from '@sanity/client'
import {of, throwError} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'

import {createHttpError} from '../machines/utils'
import type {HttpError} from '../types'
import {withMaxConcurrency} from './withMaxConcurrency'

const fetchExisting$ = (client: SanityClient, type: string, hash: string) => {
  return client.observable.fetch('*[_type == $documentType && sha1hash == $hash][0]', {
    documentType: type,
    hash,
  })
}

const readFile = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })

const hexFromBuffer = (buffer: ArrayBuffer): string => {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('')
}

/** SHA-1 of the file contents, which Sanity uses to dedupe assets. */
export const hashFile = async (file: File): Promise<string> => {
  if (!window.crypto || !window.crypto.subtle || !window.FileReader) {
    throw createHttpError(
      'Unable to generate hash: uploads are only allowed in secure contexts',
      500,
    )
  }
  const arrayBuffer = await readFile(file)
  return hexFromBuffer(await window.crypto.subtle.digest('SHA-1', arrayBuffer))
}

const uploadSanityAsset$ = (
  client: SanityClient,
  assetType: 'file' | 'image',
  file: File,
  hash: string,
) => {
  return of(null).pipe(
    // NOTE: the sanity api will still dedupe unique files, but this saves us from uploading the asset file entirely
    mergeMap(() => fetchExisting$(client, `sanity.${assetType}Asset`, hash)),
    // Cancel if the asset already exists
    mergeMap((existingAsset: SanityAssetDocument | SanityImageAssetDocument | null) => {
      if (existingAsset) {
        return throwError(
          () =>
            ({
              message: 'Asset already exists',
              statusCode: 409,
            }) satisfies HttpError,
        )
      }

      return of(null)
    }),
    mergeMap(() => {
      // Begin upload if no existing asset found
      return client.observable.assets
        .upload(assetType, file, {
          extract: ['blurhash', 'exif', 'image', 'location', 'lqip', 'palette'],
          preserveFilename: true,
        })
        .pipe(
          map((event) =>
            event.type === 'response'
              ? {
                  // rewrite to a 'complete' event
                  asset: event.body.document,
                  id: event.body.document._id,
                  type: 'complete',
                }
              : event,
          ),
        )
    }),
  )
}

export const uploadAsset$ = withMaxConcurrency(uploadSanityAsset$)
