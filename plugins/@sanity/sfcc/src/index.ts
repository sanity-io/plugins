import {type DecorationMember, definePlugin, type ObjectMember} from 'sanity'

import {SfccOfflineBanner} from './components/SfccOfflineBanner'
import {createSfccDeleteAction} from './documentActions/sfccDelete'

// Schema building blocks
export {sfccCategoryPreview, sfccCategoryStoreField} from './schemas/category'
export {sfccProductPreview, sfccProductStoreField} from './schemas/product'

// Structure builders
export {categoryStructure, productStructure} from './structure'

// Components
export {SfccDocumentStatus} from './components/SfccDocumentStatus'
export {SfccOfflineBanner} from './components/SfccOfflineBanner'

/**
 * `renderMembers` callback that injects a caution banner at the top of the
 * document form when the SFCC document is offline or deleted.
 *
 * Usage: add `renderMembers: sfccRenderMembers` to your `defineType` call.
 */
export const sfccRenderMembers = (members: ObjectMember[]): (ObjectMember | DecorationMember)[] => [
  {
    key: 'sfcc-offline-banner',
    kind: 'decoration',
    component: SfccOfflineBanner,
  },
  ...members,
]

const SFCC_TYPES = new Set(['product', 'category'])

/**
 * SFCC plugin — enforces document-level guardrails for synced commerce data:
 *
 * - Replaces the built-in `delete` action with a custom one that also cleans
 *   up associated product variants when deleting a product.
 * - Removes the `duplicate` action (documents are managed by SFCC sync).
 * - Hides product / category from the "Create new document" menu
 *   (new documents are only created by the sync process).
 */
export const sfccPlugin = definePlugin(() => ({
  name: 'sfcc',
  document: {
    actions: (prev, context) => {
      if (SFCC_TYPES.has(context.schemaType)) {
        return prev
          .filter((action) => action.action !== 'duplicate')
          .map((action) => (action.action === 'delete' ? createSfccDeleteAction(action) : action))
      }
      return prev
    },
    newDocumentOptions: (prev) => {
      return prev.filter((template) => !SFCC_TYPES.has(template.templateId))
    },
  },
}))
