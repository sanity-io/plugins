import {useMemo} from 'react'
import {ObjectSchemaType, Schema} from 'sanity'

import {isType} from '../utils/types'

const defaultProjection = '{...}'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useDefaultIndex(schema: Schema, dataset: string) {
  const defaultFilter = useMemo(
    () =>
      `_type in [${schema
        .getTypeNames()
        .map((n) => schema.get(n))
        .filter((schemaType): schemaType is ObjectSchemaType =>
          Boolean(schemaType && isType(schemaType, 'document')),
        )
        .filter(
          (documentType) =>
            !documentType.name.startsWith('sanity.') &&
            !documentType.name.startsWith('assist.') &&
            documentType.name !== 'document',
        )
        .map((documentType) => `"${documentType.name}"`)
        .join(',\n')}]`,
    [schema],
  )

  return useMemo(
    () => ({
      dataset,
      projection: defaultProjection,
      filter: defaultFilter,
    }),
    [defaultFilter, dataset],
  )
}
