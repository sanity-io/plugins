/* eslint-disable no-console */
/**
 * Seed script for reproducing https://github.com/sanity-io/plugins/issues/520
 * in the dev test-studio "kitchen-sink" workspace.
 *
 * What it does:
 *  1. Creates (or reuses) an `issue520Repro` document with id 'issue-520-repro'.
 *  2. Creates a release.
 *  3. Adds a version of the document inside the release, with the
 *     internationalized array items in a deliberately misordered key sequence
 *     [es, en, de, fr] (master config order is [en, es, fr, de, pt, it]).
 *  4. Publishes the release immediately.
 *
 * After running:
 *  - In the studio (kitchen-sink workspace), open the published version of
 *    `issue-520-repro`. The "Localized text" field will crash with
 *    "Attempted to patch a read-only document".
 *
 * Required env vars:
 *  - SANITY_STUDIO_PROJECT_ID — defaults to 'ppsg7ml5'
 *  - SANITY_STUDIO_DATASET — defaults to 'plugins'
 *  - SANITY_AUTH_TOKEN — a token with editor/publish rights on the dataset
 *
 * Run from the monorepo root:
 *   pnpm --filter test-studio seed:issue-520
 */
import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const token = process.env.SANITY_AUTH_TOKEN

if (!token) {
  console.error('Missing SANITY_AUTH_TOKEN. Create one at:')
  console.error(`  https://www.sanity.io/manage/project/${projectId}/api#tokens`)
  console.error('It needs editor (write + publish) permissions.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-03-01',
  useCdn: false,
})

const PUBLISHED_ID = 'issue-520-repro'
const RELEASE_ID = `issue520-${Date.now()}`

// Deliberately reversed/randomized order. Master config order in
// dev/test-studio/src/internationalized-array/index.tsx is:
//   [en, es, fr, de, pt, it]
// Pushing in this order is what triggers the bug.
const localized = [
  {_key: 'es', _type: 'internationalizedArrayStringValue', value: 'Hola desde el seed'},
  {_key: 'en', _type: 'internationalizedArrayStringValue', value: 'Hello from the seed'},
  {_key: 'de', _type: 'internationalizedArrayStringValue', value: 'Hallo aus dem Seed'},
  {_key: 'fr', _type: 'internationalizedArrayStringValue', value: 'Bonjour du seed'},
]

async function main() {
  console.log(`Project ${projectId} / dataset ${dataset}`)

  // 1. Create the release
  console.log(`Creating release ${RELEASE_ID}...`)
  await client.releases.create({
    releaseId: RELEASE_ID,
    metadata: {
      title: `Issue #520 repro (${new Date().toISOString()})`,
      description: 'Misordered internationalized array; triggers the read-only patch crash.',
      releaseType: 'asap',
    },
  })

  // 2. Add the document version to the release
  console.log(`Adding versions.${RELEASE_ID}.${PUBLISHED_ID} to release...`)
  await client.createVersion({
    releaseId: RELEASE_ID,
    publishedId: PUBLISHED_ID,
    document: {
      _type: 'issue520Repro',
      title: 'Issue #520 reproduction',
      localized,
    },
  })

  // 3. Publish the release immediately
  console.log('Publishing the release...')
  await client.releases.publish({releaseId: RELEASE_ID})

  console.log('')
  console.log('✓ Done. Open the published version of "issue-520-repro" in the')
  console.log('  kitchen-sink workspace and switch perspective if needed.')
  console.log('  The Localized field should crash with')
  console.log('  "Attempted to patch a read-only document".')
}

main().catch((err) => {
  console.error('Seed failed:', err?.message || err)
  if (err?.responseBody) console.error(err.responseBody)
  process.exit(1)
})
