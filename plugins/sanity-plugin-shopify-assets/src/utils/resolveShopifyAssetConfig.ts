const MAX_TYPE_DEPTH = 8

interface ShopifyAssetSchemaNode {
  options?: {
    shopifyDomain?: unknown
    dataset?: unknown
  } | null
  type?: unknown
}

interface ResolvedShopifyAssetConfig {
  shopifyDomain?: string
  dataset?: string
}

/**
 * Field `options` replace the parent type's `options` object rather than merging
 * with it. Walk the type chain so a field can override one setting and still
 * inherit the other from the plugin.
 */
export function resolveShopifyAssetConfig(
  schemaType: ShopifyAssetSchemaNode | null | undefined,
): ResolvedShopifyAssetConfig {
  return {
    shopifyDomain: readConfiguredString(schemaType, 'shopifyDomain'),
    dataset: readConfiguredString(schemaType, 'dataset'),
  }
}

function isSchemaNode(value: unknown): value is ShopifyAssetSchemaNode {
  return typeof value === 'object' && value !== null
}

function readConfiguredString(
  schemaType: ShopifyAssetSchemaNode | null | undefined,
  key: 'shopifyDomain' | 'dataset',
): string | undefined {
  const seen = new Set<object>()
  let current: ShopifyAssetSchemaNode | null | undefined = schemaType

  for (let depth = 0; current && depth < MAX_TYPE_DEPTH; depth += 1) {
    if (seen.has(current)) return undefined
    seen.add(current)

    const value = current.options?.[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }

    if (!isSchemaNode(current.type)) return undefined
    current = current.type
  }

  return undefined
}
