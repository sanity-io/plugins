import type {DatasetsResponse} from '@sanity/client'

import {createE2EClient} from '../helpers/e2eClient.js'
import {loadE2eEnvFiles} from '../helpers/env.js'
import {sanityIdify} from '../helpers/sanityIdify.js'

loadE2eEnvFiles()

const rawDataset = process.env.SANITY_E2E_DATASET?.trim()
if (!rawDataset) {
  throw new Error(
    'Missing SANITY_E2E_DATASET. Example: SANITY_E2E_DATASET=pr-123-chromium-456 pnpm e2e:setup',
  )
}

const dataset = sanityIdify(rawDataset)
const projectId = process.env.SANITY_E2E_PROJECT_ID?.trim()
if (!projectId) {
  throw new Error('Missing SANITY_E2E_PROJECT_ID')
}

const client = createE2EClient(dataset)

console.info(`[e2e] Project ${projectId} — ensuring dataset ${dataset}`)

const datasets: DatasetsResponse = await client.datasets.list()
if (!datasets.find((ds) => ds.name === dataset)) {
  console.info(`[e2e] Creating dataset ${dataset} on ${projectId}`)
  await client.datasets.create(dataset, {aclMode: 'public'})
  console.info(`[e2e] Created dataset ${dataset} on ${projectId}`)
} else {
  console.info(`[e2e] Dataset ${dataset} already exists on ${projectId}`)
}
