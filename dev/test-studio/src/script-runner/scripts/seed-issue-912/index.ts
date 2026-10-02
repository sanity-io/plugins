import {
  ISSUE_912_DOCUMENT_ID,
  ISSUE_912_EXCLUDE_DOCUMENT_ID,
  issue912EnglishValues,
} from '../../../assist/issue-912-repro'
import type {StudioScript} from '../../types'

const seedIssue912: StudioScript = {
  name: 'seed-issue-912',
  title: 'Seed issue #912 repro',
  description:
    'Creates two drafts: a readOnly internationalized slug, and an assist-excluded SKU. Run Translate fields on each.',
  apiVersion: '2026-03-01',
  async run({client, log}) {
    log.info('Replacing draft issue-912-repro (readOnly slug)...')
    await client.createOrReplace({
      _id: `drafts.${ISSUE_912_DOCUMENT_ID}`,
      _type: 'issue912Repro',
      title: issue912EnglishValues.title,
      slug: issue912EnglishValues.slug,
    })

    log.info('Replacing draft issue-912-exclude-repro (excluded sku)...')
    await client.createOrReplace({
      _id: `drafts.${ISSUE_912_EXCLUDE_DOCUMENT_ID}`,
      _type: 'issue912ExcludeRepro',
      title: issue912EnglishValues.title,
      sku: issue912EnglishValues.sku,
    })

    log.success('Drafts are ready in the home workspace, under Input plugins.')
    log.info('Open each document, then AI Assist → Translate fields → English to Spanish.')
    log.info('Slug should stay "hello" and not gain Spanish. On this branch it is overwritten.')
    log.info(
      'The exclude document should translate Title only. On this branch the task fails: No schema exists for segment "sku".',
    )
  },
}

export default seedIssue912
