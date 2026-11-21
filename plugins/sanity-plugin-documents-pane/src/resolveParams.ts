import type {DocumentVersionsCollection, DocumentsPaneQueryParams} from './types'

interface ResolveParamsOptions {
  params?: DocumentsPaneQueryParams
  document: DocumentVersionsCollection
  useDraft: boolean
}

type ResolveParamsReturn = undefined | Record<string, string>

function getPath(obj: unknown, path: string): unknown {
  let value = obj
  for (const key of path.split('.')) {
    value = value ? Reflect.get(new Object(value), key) : undefined
  }
  return value
}

function defaultResolver(options: ResolveParamsOptions): Record<string, unknown> | undefined {
  const {params, document, useDraft} = options

  if (!params || typeof params === 'function') {
    return {}
  }

  const doc = useDraft ? document.displayed : document.published

  if (!doc) {
    return undefined
  }

  const resolved: Record<string, unknown> = {}

  for (const [key, path] of Object.entries(params)) {
    resolved[key] = getPath(doc, path)
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
