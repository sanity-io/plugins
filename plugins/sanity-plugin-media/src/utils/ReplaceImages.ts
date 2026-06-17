import type {Asset} from '../types'

type ImageNode = {
  _type?: unknown
  asset?: {_ref?: unknown} & Record<string, unknown>
} & Record<string, unknown>

/**
 * Walks a document and collects patch objects that re-point matching image
 * assets (those referencing `assetToReplaceId`) at the replacement asset.
 *
 * The matched image nodes are mutated in place (`asset._ref` is updated) and
 * returned keyed by the top-level field they were found under, ready to be
 * passed to `client.patch().set()`.
 *
 * NOTE: ported as-is from sanity-plugin-media#236. Because of GROQ limitations
 * the matching image objects are filtered out of the document manually rather
 * than via a projection.
 */
export function findImageAssets(
  document: Record<string, unknown>,
  newAsset: Asset,
  assetToReplaceId: string,
): Record<string, unknown>[] {
  const foundEntries: Record<string, unknown>[] = []
  findNestedObjects(document, foundEntries, newAsset, assetToReplaceId)
  return foundEntries
}

function findNestedObjects(
  node: unknown,
  foundEntries: Record<string, unknown>[],
  newAsset: Asset,
  assetToReplaceId: string,
  currentPath = '',
): void {
  if (typeof node !== 'object' || node === null) {
    return
  }

  const candidate = node as ImageNode
  if (candidate._type === 'image' && candidate.asset && candidate.asset._ref === assetToReplaceId) {
    candidate.asset._ref = newAsset._id

    if (!foundEntries.some((entry) => currentPath in entry)) {
      foundEntries.push({[currentPath]: node})
    }
  }

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null) {
      const newPath = currentPath ? currentPath : key
      findNestedObjects(value, foundEntries, newAsset, assetToReplaceId, newPath)
    }
  }
}
