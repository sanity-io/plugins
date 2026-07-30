import {type ContextType, useContext, useMemo} from 'react'
import {type ObjectSchemaType, useSchema} from 'sanity'
import {PortableTextMemberSchemaTypesContext} from 'sanity/_singletons'

import type {PickerItemsContext} from './types'

/**
 * Resolves the Portable Text array type and its insertable member types from
 * where this plugin renders — inside the PT input's `EditorProvider`.
 *
 * Primary source: Studio's own member-schema context, which the PT input
 * provides above the plugins slot. It carries the containing array type and
 * its non-text-block members as full Studio schema types, so aliased members
 * (`{type: 'image', name: 'photo'}`), inline-declared members, and arrays
 * defined inline on a field all resolve with member-level fidelity and no
 * configuration. Fallback: an explicit `arrayTypeName` looked up in the
 * workspace schema — the escape hatch for environments where the context is
 * unavailable. With neither, callers get `null` and must render nothing
 * (never an empty picker).
 *
 * Together with openBlockOnInsert.ts, this module is one of exactly two
 * importers of `sanity/_singletons` — an internal subpath with no stability
 * guarantee (the context exists since sanity 5.6.0, which the peer range
 * pins). The dependency stays quarantined here so it can be swapped for a
 * public API (an exported `usePortableTextMemberSchemaTypes`, or a
 * `schemaType` on `PortableTextPluginsProps`) in one place.
 */

// The context's value type lives in @portabletext/sanity-bridge, which
// consumer studios cannot resolve directly (it is sanity's own dependency) —
// extract it from the context instead of importing the bridge.
type MemberSchemaTypes = NonNullable<ContextType<typeof PortableTextMemberSchemaTypesContext>>

export function usePickerItemsContext(arrayTypeName?: string): PickerItemsContext | null {
  const memberSchemaTypes: MemberSchemaTypes | null = useContext(
    PortableTextMemberSchemaTypesContext,
  )
  const schema = useSchema()

  return useMemo(() => {
    if (memberSchemaTypes) {
      return {
        memberTypes: memberSchemaTypes.blockObjects,
        schemaType: memberSchemaTypes.portableText,
      }
    }
    const arrayType = arrayTypeName ? schema.get(arrayTypeName) : undefined
    if (!arrayType || arrayType.jsonType !== 'array') return null
    return {
      memberTypes: arrayType.of.filter(
        (member): member is ObjectSchemaType =>
          member.jsonType === 'object' && !isTextBlockMember(member),
      ),
      schemaType: arrayType,
    }
  }, [arrayTypeName, memberSchemaTypes, schema])
}

/**
 * Whether a member resolves to the built-in text block: walk the compiled
 * `type` chain to its root and compare the root's name — the same algorithm
 * Studio's schema bridge uses to bucketize `of`. A literal `name === 'block'`
 * check would miss aliased text blocks (`{name: 'myBlock', type: 'block'}`)
 * and wrongly offer them as object inserts.
 */
function isTextBlockMember(memberType: {
  name: string
  type?: {name: string; type?: unknown} | undefined
}): boolean {
  let current: {name: string; type?: unknown} = memberType
  while (current.type && typeof current.type === 'object' && 'name' in current.type) {
    // oxlint-disable-next-line no-unsafe-type-assertion
    current = current.type as {name: string; type?: unknown}
  }
  return current.name === 'block'
}
