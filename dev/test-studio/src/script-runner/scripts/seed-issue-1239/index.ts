import type {StudioScript} from '../../types'
import {
  bookId,
  DEFAULT_DOCUMENT_COUNT,
  DEFAULT_TREE_DOCUMENT_ID,
  parseDocumentCount,
  treeNodeKey,
} from './helpers'

/**
 * Seeds the Issue #1239 hierarchy hang case: dozens of published documents
 * arranged as visible rows in a dedicated hierarchy.tree document.
 *
 * The hang itself is only visible on the reproduction commit before the
 * stylesheet was hoisted out of each row (see REPRO.md).
 */
const seedIssue1239: StudioScript = {
  name: 'seed-issue-1239',
  title: 'Seed issue #1239 hierarchy hang',
  description:
    'Creates ~40 published hierarchy books and arranges them in the Issue #1239 table of contents so switching to/from that view can be timed.',
  apiVersion: '2026-03-01',
  inputs: [
    {
      name: 'treeDocumentId',
      title: 'Hierarchy document ID',
      description: 'Published hierarchy.tree document that stores the arranged rows.',
      defaultValue: DEFAULT_TREE_DOCUMENT_ID,
      placeholder: DEFAULT_TREE_DOCUMENT_ID,
      required: true,
    },
    {
      name: 'documentCount',
      title: 'Document count',
      description: 'How many published hierarchyBook documents to create and put in the tree.',
      defaultValue: String(DEFAULT_DOCUMENT_COUNT),
      placeholder: String(DEFAULT_DOCUMENT_COUNT),
      required: true,
    },
  ],
  async run({client, inputs, log}) {
    const treeDocumentId = inputs.treeDocumentId.trim()
    const documentCount = parseDocumentCount(inputs.documentCount)

    if (!treeDocumentId) {
      throw new Error('Hierarchy document ID is required.')
    }

    log.info(`Creating ${documentCount} published hierarchyBook documents...`)

    const transaction = client.transaction()
    const tree = Array.from({length: documentCount}, (_, index) => {
      const id = bookId(index + 1)
      transaction.createOrReplace({
        _id: id,
        _type: 'hierarchyBook',
        title: `Issue #1239 Book ${index + 1}`,
      })

      return {
        _key: treeNodeKey(index + 1),
        _type: 'hierarchy.tree.node',
        // Flat list keeps every row mounted (expanded by default).
        parent: null,
        value: {
          _type: 'hierarchy.tree.nodeValue',
          docType: 'hierarchyBook',
          reference: {
            _type: 'reference',
            _ref: id,
            _weak: true,
          },
        },
      }
    })

    transaction.createOrReplace({
      _id: treeDocumentId,
      _type: 'hierarchy.tree',
      tree,
    })

    await transaction.commit({visibility: 'async'})

    log.success(`Seeded ${documentCount} books into "${treeDocumentId}".`)
    log.info(
      'Open Document list builders → Issue #1239 hierarchy hang, then leave that pane and watch for a multi-second freeze.',
    )
    log.info(
      'On this branch the freeze is fixed. To feel the hang, check out the reproduction commit from REPRO.md first.',
    )
  },
}

export default seedIssue1239
