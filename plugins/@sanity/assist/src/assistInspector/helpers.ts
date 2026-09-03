// oxlint-disable no-accumulating-spread
import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {BlockquoteIcon} from '@sanity/icons/Blockquote'
import {DocumentIcon} from '@sanity/icons/Document'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {OlistIcon} from '@sanity/icons/Olist'
import {StringIcon} from '@sanity/icons/String'
import {extractWithPath} from '@sanity/mutator'
import {type ComponentType, useMemo} from 'react'
import {
  type ArraySchemaType,
  isKeySegment,
  isObjectSchemaType,
  type ObjectSchemaType,
  type Path,
  pathToString,
  type SanityDocumentLike,
  type SchemaType,
  stringToPath,
} from 'sanity'
import {type PaneRouterContextValue, usePaneRouter} from 'sanity/structure'

import {useAiAssistanceConfig} from '../assistLayout/AiAssistanceConfigContext'
import {isAssistSupported} from '../helpers/assistSupported'
import {isPortableTextArray, isType} from '../helpers/typeUtils'
import {type AssistInspectorRouteParams, documentRootKey} from '../types'

export interface FieldRef {
  key: string
  path: Path
  title: string
  schemaType: SchemaType
  icon: ComponentType
  synthetic?: boolean
}

/**
 * Default for `assist.maxFieldSelectionDepth`: how many path segments deep fields are collected
 * for the field picker and the per-field assist actions.
 */
export const DEFAULT_MAX_FIELD_SELECTION_DEPTH = 6

function getTypeIcon(schemaType: SchemaType): ComponentType {
  let t: SchemaType | undefined = schemaType

  while (t) {
    if (t.icon) return t.icon
    t = t.type
  }

  if (isType(schemaType, 'slug')) return LinkIcon
  if (isType(schemaType, 'image')) return ImageIcon
  if (schemaType.jsonType === 'array' && isPortableTextArray(schemaType)) return BlockContentIcon

  if (schemaType.jsonType === 'array') return OlistIcon
  if (schemaType.jsonType === 'object') return BlockquoteIcon
  if (schemaType.jsonType === 'string') return StringIcon

  return DocumentIcon
}

export function asFieldRefsByTypePath(fieldRefs: FieldRef[]): Record<string, FieldRef | undefined> {
  const lookup: Record<string, FieldRef | undefined> = fieldRefs.reduce(
    (acc, ref) => ({...acc, [ref.key]: ref}),
    {},
  )
  return lookup
}

export function getDocumentFieldRef(schemaType: ObjectSchemaType): FieldRef {
  return {
    key: documentRootKey,
    icon: schemaType.icon ?? DocumentIcon,
    title: `The entire document`,
    path: [],
    schemaType: schemaType,
  }
}

/**
 * Collects every field (and synthetic array item) in `schemaType` that AI Assist can attach
 * instructions to.
 *
 * @param maxDepth - max number of path segments a collected field can have; deeper fields are
 * skipped. Arrays contribute one segment for the item type (`array[_key="type"]`).
 */
export function getFieldRefs(
  schemaType: ObjectSchemaType,
  maxDepth = DEFAULT_MAX_FIELD_SELECTION_DEPTH,
): FieldRef[] {
  return getObjectFieldRefs(schemaType, undefined, 0, maxDepth)
}

function getObjectFieldRefs(
  schemaType: ObjectSchemaType,
  parent: FieldRef | undefined,
  depth: number,
  maxDepth: number,
): FieldRef[] {
  if (depth >= maxDepth) {
    return []
  }
  return (
    schemaType.fields
      .filter((f) => !f.name.startsWith('_'))
      // oxlint-disable-next-line no-map-spread
      .flatMap((field) => {
        const path: Path = parent ? [...parent.path, field.name] : [field.name]
        const title = field.type.title ?? field.name
        const fieldRef: FieldRef = {
          key: patchableKey(pathToString(path)),
          path,
          title: parent ? [parent.title, title].join(' / ') : title,
          schemaType: field.type,
          icon: getTypeIcon(field.type),
        }
        const fields =
          field.type.jsonType === 'object'
            ? getObjectFieldRefs(field.type, fieldRef, depth + 1, maxDepth)
            : []

        const syntheticFields =
          field.type.jsonType === 'array'
            ? getSyntheticFields(field.type, fieldRef, depth + 1, maxDepth)
            : []
        if (!isAssistSupported(field.type)) {
          return [...fields, ...syntheticFields]
        }
        return [fieldRef, ...fields, ...syntheticFields]
      })
  )
}

function getSyntheticFields(
  schemaType: ArraySchemaType,
  parent: FieldRef | undefined,
  depth: number,
  maxDepth: number,
): FieldRef[] {
  if (depth >= maxDepth) {
    return []
  }

  return (
    schemaType.of
      .filter((itemType) => !isType(itemType, 'block'))
      // oxlint-disable-next-line no-map-spread
      .flatMap((itemType) => {
        const segment = {_key: itemType.name}
        const title = itemType.title ?? itemType.name
        const path: Path = parent ? [...parent.path, segment] : [segment]
        const fieldRef: FieldRef = {
          key: patchableKey(pathToString(path)),
          path,
          title: parent ? [parent.title, title].join(' / ') : title,
          schemaType: itemType,
          icon: getTypeIcon(itemType),
          synthetic: true,
        }
        const fields =
          itemType.jsonType === 'object'
            ? getObjectFieldRefs(itemType, fieldRef, depth + 1, maxDepth)
            : []

        if (!isAssistSupported(itemType)) {
          return fields
        }
        return [fieldRef, ...fields]
      })
  )
}

export function getTypePath(doc: SanityDocumentLike, pathString: string) {
  if (!pathString) {
    return undefined
  }

  const path = stringToPath(pathString)
  const currentPath: Path = []
  let valid = true
  const syntheticPath = path.map((segment) => {
    currentPath.push(segment)

    if (isKeySegment(segment)) {
      const match = extractWithPath(pathToString(currentPath), doc)[0]
      const value = match?.value
      if (match && value && typeof value === 'object' && '_type' in value) {
        // oxlint-disable-next-line no-unsafe-type-assertion
        return {_key: value._type as string}
      }
      valid = false
    }
    return segment
  })

  return valid ? patchableKey(pathToString(syntheticPath)) : undefined
}

/**
 * mutator crashes if path contains certain letters
 * @param pathKey
 */
function patchableKey(pathKey: string) {
  return pathKey.replace(/[=]=/g, ':').replace(/[[\]]/g, '|').replace(/"/g, '')
}

export function useTypePath(doc: SanityDocumentLike, pathString: string) {
  return useMemo(() => getTypePath(doc, pathString), [doc, pathString])
}

export function useSelectedField(
  documentSchemaType?: SchemaType,
  path?: string,
): FieldRef | undefined {
  const {getFieldRefs} = useAiAssistanceConfig()

  const selectableFields = useMemo(
    () =>
      documentSchemaType && isObjectSchemaType(documentSchemaType)
        ? [getDocumentFieldRef(documentSchemaType), ...getFieldRefs(documentSchemaType.name)]
        : [],
    [documentSchemaType, getFieldRefs],
  )

  return useMemo(() => {
    return path ? selectableFields?.find((f) => f.key === path) : undefined
  }, [selectableFields, path])
}

export function getFieldTitle(field?: FieldRef) {
  const schemaType = field?.schemaType
  return field?.title ?? schemaType?.title ?? schemaType?.name ?? 'Untitled'
}

export type AiPaneRouter = Omit<PaneRouterContextValue, 'setParams' | 'params'> & {
  params: AssistInspectorRouteParams
  setParams: (p: Record<keyof AssistInspectorRouteParams, string | undefined>) => void
}

export function useAiPaneRouter(): AiPaneRouter {
  const paneRouter = usePaneRouter()

  return useMemo(() => ({...paneRouter, params: paneRouter.params ?? {}}), [paneRouter])
}
