import {createClient} from '@sanity/client'
import {expect, test} from 'vitest'

import {uploadedAssetTransaction} from './upload'

const client = createClient({
  projectId: 'abc123',
  dataset: 'test',
  apiVersion: '2024-03-05',
  useCdn: false,
})

test('a finished upload patches its fields instead of replacing the document', () => {
  const fields = {
    status: 'preparing',
    data: {id: 'asset-1', status: 'preparing'},
    assetId: 'asset-1',
    playbackId: 'playback-1',
    uploadId: 'upload-1',
  }

  const mutations = uploadedAssetTransaction(client, 'doc-1', fields).serialize()

  expect(mutations).toEqual([
    {createIfNotExists: {_id: 'doc-1', _type: 'mux.videoAsset'}},
    {patch: {id: 'doc-1', set: fields}},
  ])
  expect(JSON.stringify(mutations)).not.toContain('createOrReplace')
})

test('a finished upload names the asset after the file, unless it already has a name', () => {
  const fields = {status: 'preparing', assetId: 'asset-1'}

  const mutations = uploadedAssetTransaction(client, 'doc-1', fields, 'launch-film.mp4').serialize()

  expect(mutations).toEqual([
    {createIfNotExists: {_id: 'doc-1', _type: 'mux.videoAsset'}},
    {patch: {id: 'doc-1', set: fields, setIfMissing: {filename: 'launch-film.mp4'}}},
  ])
})
