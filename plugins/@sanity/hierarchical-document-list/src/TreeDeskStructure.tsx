import {Box, Flex, Spinner} from '@sanity/ui'
import {lazy, Suspense, useCallback, useEffect} from 'react'
import {
  useDocumentOperation,
  useEditState,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {type PatchEvent} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2'

import DeskWarning from './components/DeskWarning'
import type {DocumentOperations, StoredTreeItem, TreeDeskStructureProps} from './types'
import {toGradient} from './utils/gradientPatchAdapter'
import injectNodeTypeInPatches, {DEFAULT_DOC_TYPE} from './utils/injectNodeTypeInPatches'

interface ComponentProps {
  options: TreeDeskStructureProps
}

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const TreeEditor = lazy(() => import('./components/TreeEditor'))

const spinner = (
  <Flex padding={5} align={'center'} justify={'center'} height={'fill'}>
    <Spinner width={4} muted />
  </Flex>
)

export const DEFAULT_FIELD_KEY = 'tree'

const TreeDeskStructure = (props: ComponentProps) => {
  const treeDocType = props.options.documentType || DEFAULT_DOC_TYPE
  const treeFieldKey = props.options.fieldKeyInDocument || DEFAULT_FIELD_KEY
  const {published, draft, liveEdit} = useEditState(props.options.documentId, treeDocType)
  const {patch} = useDocumentOperation(props.options.documentId, treeDocType) as DocumentOperations

  const treeValue = (published?.[treeFieldKey] || []) as StoredTreeItem[]

  const handleChange = useCallback(
    (patchEvent: PatchEvent) => {
      if (!patch?.execute) {
        return
      }
      patch.execute(toGradient(injectNodeTypeInPatches(patchEvent.patches, treeDocType)))
    },
    [patch, treeDocType],
  )

  const publishedId = published?._id

  useEffect(() => {
    if (!publishedId && patch?.execute && !patch?.disabled) {
      // If no published document, create it
      patch.execute([{setIfMissing: {[treeFieldKey]: []}}])
    }
  }, [publishedId, patch, treeFieldKey])

  if (!liveEdit) {
    return (
      <DeskWarning
        title="Invalid configuration"
        subtitle="The `documentType` passed to `createStructureHierarchy` isn't live editable.\nTo continue using this plugin, add `liveEdit: true` to your custom schema type or unset `documentType` in your hierarchy configuration."
      />
    )
  }

  if (draft?._id) {
    return (
      <DeskWarning
        title="This hierarchy tree contains a draft"
        subtitle="Click on the button below to publish your draft in order to continue editing the live published document."
      />
    )
  }

  if (!published?._id) {
    return spinner
  }

  return (
    <Box paddingBottom={5} paddingRight={2}>
      <Suspense fallback={spinner}>
        <TreeEditor
          options={props.options}
          tree={treeValue}
          onChange={handleChange}
          patchPrefix={treeFieldKey}
        />
      </Suspense>
    </Box>
  )
}

export default TreeDeskStructure
