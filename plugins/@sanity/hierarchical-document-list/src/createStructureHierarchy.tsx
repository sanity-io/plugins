import {AddIcon} from '@sanity/icons'
import type {FC} from 'react'

import TreeDeskStructure from './TreeDeskStructure'
import type {TreeDeskStructureProps} from './types'
import throwError from './utils/throwError'

export interface TreeProps extends TreeDeskStructureProps {
  /**
   * Visible title above the tree.
   * Also used as the label in the structure list item.
   */
  title: string

  /**
   * Optional icon for rendering the item in the structure.
   */
  icon?: any

  /**
   * The `ConfigContext` available as the second parameter of the structure resolver.
   */
  context?: any
  /**
   * The `StructureBuilder` (`S`) available as the first parameter of the structure resolver.
   */
  S?: any
  /**
   * Restrict document types that can be created.
   */
  creatableTypes?: string[]
}

const structureTreeValidator = (props: TreeProps): FC => {
  const {documentId, referenceTo} = props
  if (typeof documentId !== 'string' || !documentId) {
    throwError('invalidDocumentId')
  }
  if (!Array.isArray(referenceTo)) {
    throwError('invalidReferenceTo', `(documentId "${documentId}")`)
  }

  return (structureProps) => <TreeDeskStructure {...structureProps} options={props} />
}

export default function createStructureHierarchy(props: TreeProps) {
  const {documentId, referenceTo, referenceOptions, context, S, creatableTypes} = props
  if (!S || !context) {
    throw new Error(
      'Invalid configuration. S or context props are undefined. ' +
        'These props are available as function parameters when configuring structure, and must be passed along to createStructureHierarchy. ' +
        'Confer the plugin README for example usage.',
    )
  }

  const {schema} = context

  const safelyCreatableTypes =
    creatableTypes && creatableTypes.every((type) => referenceTo.includes(type))
      ? creatableTypes
      : referenceTo

  let mainList = (
    referenceTo?.length === 1
      ? S.documentTypeList(referenceTo[0]).schemaType(referenceTo[0])
      : S.documentList().filter('_type in $types').params({types: referenceTo})
  )
    .id(documentId)
    .menuItems(
      (safelyCreatableTypes || []).map((schemaType) =>
        S.menuItem()
          .intent({
            type: 'create',
            params: {type: schemaType},
          })
          .title(`Create ${schema.get(schemaType)?.title}`)
          .icon(schema.get(schemaType)?.icon || AddIcon),
      ),
    )
    .canHandleIntent((intent: string, c: Record<string, unknown>) => {
      // Can edit itself
      if (intent === 'edit' && c['id'] === props.documentId) {
        return true
      }
      // Can create & edit referenced document types
      const intentType = c['type']
      if (typeof intentType === 'string' && safelyCreatableTypes.includes(intentType)) {
        return true
      }
      return false
    })

  if (referenceOptions?.filter) {
    mainList = mainList.filter(referenceOptions.filter)
  }

  if (referenceOptions?.filterParams) {
    mainList = mainList.params(referenceOptions.filterParams)
  }

  return S.listItem()
    .id(documentId)
    .title(props.title || documentId)
    .icon(props.icon)
    .child(
      Object.assign(
        mainList.serialize(),
        {
          type: 'component',
          component: structureTreeValidator(props),
          options: props,
          __preserveInstance: true,
        },
        props.title ? {title: props.title} : {},
      ),
    )
}
