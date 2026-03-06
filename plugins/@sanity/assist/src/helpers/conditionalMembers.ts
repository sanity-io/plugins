import {
  type ArrayOfObjectsFormNode,
  type ArrayOfObjectsItemMember,
  type ArrayOfPrimitivesFormNode,
  type DocumentFormNode,
  type FieldsetState,
  isObjectSchemaType,
  type ObjectFormNode,
  type Path,
  pathToString,
  type SchemaType,
} from 'sanity'

const DEFAULT_MAX_DEPTH = 8
const ABSOLUTE_MAX_DEPTH = 50

export interface ConditionalMemberState {
  path: string
  hidden: boolean
  readOnly: boolean
}

interface ConditionalMemberInnerState extends ConditionalMemberState {
  conditional: boolean
}

/**
 * This is used to statically determine the state of the functions on the server-side.
 * Paths which has a schema with conditional config should be considered hidden: true and/or readOnly: true
 * Only conditional paths are included, as static props can be determined from schema.
 *
 * Returns paths that has conditional hidden or readOnly schema config (function) and that.
 * Form-state does not contain hidden members.
 *
 * Note:
 * * If a parent path is hidden, no child paths are included
 * * If a parent path is readOnly, no child paths are included
 * * If a path is hidden, it is not included; only conditionally visible paths will be returned, with hidden: false
 */
export function getConditionalMembers(
  docState: DocumentFormNode,
  maxDepth = DEFAULT_MAX_DEPTH,
): ConditionalMemberState[] {
  const doc: ConditionalMemberInnerState = {
    path: '',
    hidden: false,
    readOnly: !!docState.readOnly,
    conditional: isConditional(docState.schemaType),
  }
  return [doc, ...extractConditionalPaths(docState, Math.min(maxDepth, ABSOLUTE_MAX_DEPTH))]
    .filter((v) => v.conditional)
    .map(({conditional: _conditional, ...state}) => state)
}

function isConditional(schemaType: SchemaType) {
  return typeof schemaType.hidden === 'function' || typeof schemaType.readOnly === 'function'
}

function conditionalState(memberState: {
  path: Path
  schemaType: SchemaType
  readOnly?: boolean
}): ConditionalMemberInnerState {
  return {
    path: pathToString(memberState.path),
    readOnly: !!memberState.readOnly, // Use actual form state readOnly value
    hidden: false, // If it's in form state members, it's not hidden
    conditional: isConditional(memberState.schemaType),
  }
}

function extractConditionalPaths(
  node: ObjectFormNode | FieldsetState,
  maxDepth: number,
): ConditionalMemberInnerState[] {
  if (node.path.length >= maxDepth) {
    return []
  }

  const result: ConditionalMemberInnerState[] = []

  for (const member of node.members) {
    if (member.kind === 'error') {
      continue
    }
    if (member.kind === 'field') {
      const schemaType = member.field.schemaType
      if (schemaType.jsonType === 'object') {
        const innerFields = member.field.readOnly
          ? []
          : // oxlint-disable-next-line no-unsafe-type-assertion
            extractConditionalPaths(member.field as ObjectFormNode, maxDepth)
        result.push(conditionalState(member.field), ...innerFields)
      } else if (schemaType.jsonType === 'array') {
        // oxlint-disable-next-line no-unsafe-type-assertion
        const array = member.field as ArrayOfObjectsFormNode | ArrayOfPrimitivesFormNode

        const isObjectsArray = array.members.some(
          (m) => m.kind === 'item' && isObjectSchemaType(m.item.schemaType),
        )
        result.push(conditionalState(array))
        if (!array.readOnly) {
          for (const arrayMember of array.members) {
            if (arrayMember.kind === 'error') {
              continue
            }

            const innerFields =
              isObjectsArray && !arrayMember.item.readOnly
                ? // oxlint-disable-next-line no-unsafe-type-assertion
                  extractConditionalPaths((arrayMember as ArrayOfObjectsItemMember).item, maxDepth)
                : []

            result.push(conditionalState(arrayMember.item), ...innerFields)
          }
        }
      } else {
        result.push(conditionalState(member.field))
      }
    } else if (member.kind === 'fieldSet') {
      // oxlint-disable-next-line no-unsafe-type-assertion
      const conditionalFieldset = !!(node as ObjectFormNode).schemaType?.fieldsets?.some(
        (f) => !f.single && f.name === member.fieldSet.name && typeof f.hidden === 'function',
      )
      const innerFields = extractConditionalPaths(member.fieldSet, maxDepth).map((f) =>
        conditionalFieldset && !f.conditional
          ? Object.assign({}, f, {conditional: true as const})
          : f,
      )
      result.push(...innerFields)
    }
  }

  return result
}
