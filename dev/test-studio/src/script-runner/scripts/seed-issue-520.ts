import type {StudioScript} from '../types'

function randomKey(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)

  return Array.from(values, (value) => chars[value % chars.length]).join('')
}

const DEFAULT_PUBLISHED_ID = 'issue-520-repro'

function createLocalizedValues() {
  return [
    {
      _key: randomKey(),
      language: 'es',
      _type: 'internationalizedArrayStringValue',
      value: 'Hola desde el seed',
    },
    {
      _key: randomKey(),
      language: 'en',
      _type: 'internationalizedArrayStringValue',
      value: 'Hello from the seed',
    },
    {
      _key: randomKey(),
      language: 'de',
      _type: 'internationalizedArrayStringValue',
      value: 'Hallo aus dem Seed',
    },
    {
      _key: randomKey(),
      language: 'fr',
      _type: 'internationalizedArrayStringValue',
      value: 'Bonjour du seed',
    },
  ]
}

const seedIssue520: StudioScript = {
  name: 'seed-issue-520',
  title: 'Seed issue #520 repro',
  description:
    'Creates and publishes a release with deliberately misordered internationalized array values.',
  apiVersion: '2026-03-01',
  inputs: [
    {
      name: 'publishedId',
      title: 'Published document ID',
      description: 'The published document id that the release version should target.',
      defaultValue: DEFAULT_PUBLISHED_ID,
      placeholder: DEFAULT_PUBLISHED_ID,
      required: true,
    },
  ],
  async run({client, inputs, log}) {
    const publishedId = inputs.publishedId.trim()
    const releaseId = `issue520-${Date.now()}`

    if (!publishedId) {
      throw new Error('Published document ID is required.')
    }

    log.info(`Creating release ${releaseId}...`)
    await client.releases.create({
      releaseId,
      metadata: {
        title: `Issue #520 repro (${new Date().toISOString()})`,
        description: 'Misordered internationalized array; triggers the read-only patch crash.',
        releaseType: 'asap',
      },
    })

    log.info(`Adding versions.${releaseId}.${publishedId} to release...`)
    await client.createVersion({
      releaseId,
      publishedId,
      document: {
        _type: 'issue520Repro',
        title: 'Issue #520 reproduction',
        localized: createLocalizedValues(),
      },
    })

    log.info('Publishing the release...')
    await client.releases.publish({releaseId})

    log.success(`Done. Open "${publishedId}" in the kitchen-sink workspace.`)
    log.info('The Localized field should crash with "Attempted to patch a read-only document".')
  },
}

export default seedIssue520
