import {useCallback} from 'react'
import {FormField, type FormNodePresence, PatchEvent, type Path} from 'sanity'

import TreeEditor from './components/TreeEditor'
import type {StoredTreeItem, TreeFieldSchema} from './types'
import injectNodeTypeInPatches, {DEFAULT_DOC_TYPE} from './utils/injectNodeTypeInPatches'

export interface TreeInputComponentProps {
  type: TreeFieldSchema
  value: StoredTreeItem[]
  level: number
  onChange: (event: unknown) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  readOnly: boolean
  presence: FormNodePresence[]
}

const EMPTY_PATH: Path = []

const TreeInputComponent = (props: TreeInputComponentProps) => {
  const documentType = props.type.options.documentType || DEFAULT_DOC_TYPE
  const {onChange: onFieldChange} = props

  const onChange = useCallback(
    (patch: any) => {
      const patches = injectNodeTypeInPatches(patch?.patches, documentType)
      onFieldChange(new PatchEvent(patches))
    },
    [documentType, onFieldChange],
  )

  return (
    <FormField
      description={props.type.description} // Creates description from schema
      title={props.type.title} // Creates label from schema title
      __unstable_presence={props.presence} // Handles presence avatars
      path={EMPTY_PATH}
    >
      <TreeEditor options={props.type.options} tree={props.value || []} onChange={onChange} />
    </FormField>
  )
}

export default TreeInputComponent
