import {definePlugin} from 'sanity'

import {default as createHierarchicalSchemas} from './createHierarchicalSchemas'
import {default as createStructureHierarchy, type TreeProps} from './createStructureHierarchy'
import {default as hierarchyTree} from './schemas/hierarchy.tree'
import {default as flatDataToTree} from './utils/flatDataToTree'

export {createHierarchicalSchemas, createStructureHierarchy, flatDataToTree, hierarchyTree}
export type {TreeProps}

/**
 * @deprecated Use {@link createStructureHierarchy} instead. `sanity/desk` has been
 * replaced by `sanity/structure`, so `createDeskHierarchy` was renamed to
 * `createStructureHierarchy`. This alias will be removed in a future major version.
 */
export const createDeskHierarchy = createStructureHierarchy

/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {hierarchicalDocumentList} from '@sanity/hierarchical-document-list'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [hierarchicalDocumentList()],
 * })
 * ```
 */

export const hierarchicalDocumentList = definePlugin({
  name: 'sanity-plugin-hierarchical-document-list',
})
