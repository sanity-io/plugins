/**
 * Periodic cleanup of e2e datasets.
 *
 * Handles two types of datasets:
 * - PR datasets (`pr-<number>-<browser>-<run-id>`): deleted when the PR is closed
 * - Main datasets (`main-<browser>-<run-id>`): deleted when older than 24 hours
 *
 * Runs on a schedule (every 6 hours) and can be triggered manually.
 */

import type {DatasetsResponse} from '@sanity/client'

import {createE2EClient} from '../helpers/e2eClient.js'
import {loadE2eEnvFiles} from '../helpers/env.js'

loadE2eEnvFiles()

const SANITY_E2E_PROJECT_ID = process.env.SANITY_E2E_PROJECT_ID?.trim()
const SANITY_E2E_SESSION_TOKEN = process.env.SANITY_E2E_SESSION_TOKEN?.trim()
if (!SANITY_E2E_PROJECT_ID || !SANITY_E2E_SESSION_TOKEN) {
  throw new Error('SANITY_E2E_PROJECT_ID and SANITY_E2E_SESSION_TOKEN are required for cleanup')
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'sanity-io/plugins'

const MAIN_DATASET_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

// Match dataset names like `pr-12225-chromium-22576482973`
const PR_DATASET_PATTERN = /^pr-(\d+)-/
// Match dataset names like `main-chromium-22576482973`
const MAIN_DATASET_PATTERN = /^main-(chromium|firefox)-/

type DatasetInfo = DatasetsResponse[number]

const client = createE2EClient('unused')

async function fetchOpenPrNumbers(): Promise<Set<number>> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  }

  const openPrs = new Set<number>()
  let page = 1

  // Paginate through all open PRs (sequential by design).
  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/pulls?state=open&per_page=100&page=${page}`,
      {headers},
    )

    if (!res.ok) {
      throw new Error(`Failed to list open PRs (page ${page}): ${res.status} ${res.statusText}`)
    }

    const prs = (await res.json()) as {number: number}[]
    for (const pr of prs) {
      openPrs.add(pr.number)
    }

    if (prs.length < 100) break
    page++
  }

  return openPrs
}

async function cleanupPrDatasets(datasets: DatasetsResponse): Promise<number> {
  const prDatasets = datasets.filter(
    (ds) => PR_DATASET_PATTERN.test(ds.name) && !ds.name.endsWith('-comments'),
  )

  console.log(`Found ${prDatasets.length} PR datasets total`)

  const datasetsByPr = new Map<number, DatasetInfo[]>()
  for (const ds of prDatasets) {
    const match = ds.name.match(PR_DATASET_PATTERN)
    if (match?.[1]) {
      const prNumber = Number.parseInt(match[1], 10)
      const existing = datasetsByPr.get(prNumber) || []
      existing.push(ds)
      datasetsByPr.set(prNumber, existing)
    }
  }

  console.log(`Datasets belong to ${datasetsByPr.size} unique PRs`)

  const openPrs = await fetchOpenPrNumbers()
  console.log(`Found ${openPrs.size} open PRs in ${GITHUB_REPO}`)

  let deletedCount = 0

  // Delete sequentially to avoid Sanity API rate limits (same as sanity-io/sanity).
  for (const [prNumber, prDatasetsGroup] of datasetsByPr) {
    if (openPrs.has(prNumber)) {
      console.log(`PR #${prNumber} is open, skipping ${prDatasetsGroup.length} dataset(s)`)
      continue
    }

    console.log(`PR #${prNumber} is closed, deleting ${prDatasetsGroup.length} dataset(s)`)

    for (const ds of prDatasetsGroup) {
      try {
        await client.datasets.delete(ds.name)
        console.log(`  Deleted: ${ds.name}`)
        deletedCount++
      } catch (err) {
        console.error(`  Failed to delete ${ds.name}: ${String(err)}`)
      }
    }
  }

  return deletedCount
}

async function cleanupMainDatasets(datasets: DatasetsResponse): Promise<number> {
  const now = Date.now()
  const mainDatasets = datasets.filter((ds) => MAIN_DATASET_PATTERN.test(ds.name))

  console.log(`Found ${mainDatasets.length} main datasets total`)

  let deletedCount = 0

  for (const ds of mainDatasets) {
    const age = now - new Date(ds.createdAt).getTime()
    if (age < MAIN_DATASET_MAX_AGE_MS) {
      console.log(`  Skipping ${ds.name} (${Math.round(age / 3_600_000)}h old)`)
      continue
    }

    try {
      await client.datasets.delete(ds.name)
      console.log(`  Deleted: ${ds.name} (${Math.round(age / 3_600_000)}h old)`)
      deletedCount++
    } catch (err) {
      console.error(`  Failed to delete ${ds.name}: ${String(err)}`)
    }
  }

  return deletedCount
}

async function run() {
  const datasets = await client.datasets.list()

  const prDeleted = await cleanupPrDatasets(datasets)
  const mainDeleted = await cleanupMainDatasets(datasets)

  console.log(
    `\nCleanup complete. Deleted ${prDeleted} PR dataset(s) and ${mainDeleted} main dataset(s).`,
  )
}

run().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
