import intersection from 'lodash-es/intersection.js'

export interface AssembleDocumentListQueryInput {
  query?: string
  params?: Record<string, any>
  queryParams?: Record<string, any>
  types?: string[]
  order: string
  limit: number
  documentTypeNames: string[]
}

export function assembleDocumentListQuery(input: AssembleDocumentListQueryInput): {
  assembledQuery: string
  params: Record<string, any>
} {
  if (input.query) {
    return {assembledQuery: input.query, params: input.queryParams ?? {}}
  }

  return {
    assembledQuery: `*[_type in $types] | order(${input.order}) [0...${input.limit * 2}]`,
    params: {
      types: input.types
        ? intersection(input.types, input.documentTypeNames)
        : input.documentTypeNames,
    },
  }
}
