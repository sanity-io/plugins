import type {StudioScript} from '../../types'

const DEFAULT_DOCUMENT_ID = 'issue-912-repro'

const seedIssue912: StudioScript = {
  name: 'seed-issue-912',
  title: 'Seed issue #912 repro',
  description:
    'Creates a document for testing the @sanity/assist Translate fields readOnly bug. Pre-fills English values in both writable and readOnly translatable fields so you can immediately click "Translate fields..." and observe readOnly fields being overwritten.',
  apiVersion: '2026-03-01',
  inputs: [
    {
      name: 'documentId',
      title: 'Document ID',
      description: 'Document id for the seeded repro document.',
      defaultValue: DEFAULT_DOCUMENT_ID,
      placeholder: DEFAULT_DOCUMENT_ID,
      required: true,
    },
  ],
  async run({client, inputs, log}) {
    const documentId = inputs.documentId.trim() || DEFAULT_DOCUMENT_ID

    log.info(`Creating ${documentId} as a draft with English source content...`)

    await client.createOrReplace({
      _id: `drafts.${documentId}`,
      _type: 'issue912Repro',
      title: [
        {
          _type: 'internationalizedArrayString',
          _key: 'en',
          value: 'Writable title in English',
        },
      ],
      readOnlyTitle: [
        {
          _type: 'internationalizedArrayString',
          _key: 'en',
          value: 'READ-ONLY title in English (should NOT be translated)',
        },
      ],
      details: {
        _type: 'object',
        body: [
          {
            _type: 'internationalizedArrayString',
            _key: 'en',
            value: 'Writable nested body in English',
          },
        ],
        readOnlyBody: [
          {
            _type: 'internationalizedArrayString',
            _key: 'en',
            value: 'READ-ONLY nested body in English (should NOT be translated)',
          },
        ],
      },
    })

    log.success(`Seeded drafts.${documentId}.`)
    log.info('Next:')
    log.info(`  1. Open ${documentId} in the kitchen-sink workspace.`)
    log.info('  2. Click "Translate fields..." in the document menu.')
    log.info('  3. Pick English -> Spanish (or any target) and Run.')
    log.info('  4. Use the language selector on each field to inspect the target language values.')
    log.warning(
      'Bug: `readOnlyTitle` and `details.readOnlyBody` get translated values written to them, against the docs/README contract.',
    )
  },
}

export default seedIssue912
