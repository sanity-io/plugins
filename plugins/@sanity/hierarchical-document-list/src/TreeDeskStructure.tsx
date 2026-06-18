import {Box, Flex, Spinner} from '@sanity/ui'
import {useCallback, useEffect} from 'react'
import {type PatchEvent, useDocumentOperation, useEditState} from 'sanity'

import DeskWarning from './components/DeskWarning'
import TreeEditor from './components/TreeEditor'
import type {DocumentOperations, StoredTreeItem, TreeDeskStructureProps} from './types'
import {toGradient} from './utils/gradientPatchAdapter'
import injectNodeTypeInPatches, {DEFAULT_DOC_TYPE} from './utils/injectNodeTypeInPatches'

interface ComponentProps {
  options: TreeDeskStructureProps
}

export const DEFAULT_FIELD_KEY = 'tree'

const TreeDeskStructure = (props: ComponentProps) => {
  const treeDocType = props.options.documentType || DEFAULT_DOC_TYPE
  const treeFieldKey = props.options.fieldKeyInDocument || DEFAULT_FIELD_KEY
  const {published, draft, liveEdit} = useEditState(props.options.documentId, treeDocType)
  // useDocumentOperation returns the documented DocumentOperations shape
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const {patch} = useDocumentOperation(props.options.documentId, treeDocType) as DocumentOperations

  // The configured tree field always holds an array of stored tree items
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
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
        subtitle="The `documentType` passed to `createDeskHiearchy` isn't live editable. \nTo continue using this plugin, add `liveEdit: true` to your custom schema type or unset `documentType` in your hierarchy configuration."
      />
    )
  }

  if (draft?._id) {
    return (
      <DeskWarning
        title="This hierarchy tree contains a draft"
        subtitle="Click on the button below to publish your draft in order to continue editing the live
      published document."
      />
    )
  }

  if (!published?._id) {
    return (
      <Flex padding={5} align={'center'} justify={'center'} height={'fill'}>
        <Spinner width={4} muted />
      </Flex>
    )
  }

  return (
    <Box paddingBottom={5} paddingRight={2}>
      <TreeEditor
        options={props.options}
        tree={treeValue}
        onChange={handleChange}
        patchPrefix={treeFieldKey}
      />
    </Box>
  )
}

export default TreeDeskStructure
