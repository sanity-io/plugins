import type {FieldMember, ObjectMember} from 'sanity'

import {useMemo} from 'react'

/** @internal */
export function useFieldMember(
  members: ObjectMember[],
  fieldName: string,
): FieldMember | undefined {
  return useMemo(
    () =>
      members.find(
        (member): member is FieldMember => member.kind === 'field' && member.name === fieldName,
      ),
    [members, fieldName],
  )
}
