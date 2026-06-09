import delve from 'dlv'

import type {DocumentVersionsCollection, DocumentsPaneQueryParams} from './types'

interface ResolveParamsOptions {
  params?: DocumentsPaneQueryParams
  document: DocumentVersionsCollection
  useDraft: boolean
}

type ResolveParamsReturn = undefined | Record<string, string>

function defaultResolver(
  options: ResolveParamsOptions,
): Record<string, string | undefined> | undefined {
  const {params, document, useDraft} = options

  if (!params || typeof params === 'function') {
    return {}
  }

  const doc = useDraft ? document.displayed : document.published

  if (!doc) {
    return undefined
  }

  const resolved: Record<string, string | undefined> = {}

  for (const [key, path] of Object.entries(params)) {
    resolved[key] = delve(doc, path)
  }

  return resolved
}

export default function resolveParams(options: ResolveParamsOptions): ResolveParamsReturn {
  const {params, document} = options

  const resolvedParams =
    typeof params === 'function' ? params({document}) : defaultResolver(options)

  if (!resolvedParams) {
    return undefined
  }

  const entries = Object.entries(resolvedParams)

  if (entries.some(([, value]) => value === undefined)) {
    return undefined
  }

  return Object.fromEntries(
    entries.filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}
