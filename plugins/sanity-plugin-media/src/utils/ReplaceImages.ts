import type {Asset} from '../types'

type ImageNode = {
  _type?: unknown
  asset?: {_ref?: unknown} & Record<string, unknown>
} & Record<string, unknown>

/**
 * Re-points every image asset in `document` that references `assetToReplaceId`
 * at `newAsset`, mutating the document in place, and returns one patch object
 * per affected top-level field in the form `{[field]: <full mutated field value>}`.
 *
 * Each patch carries the entire (mutated) top-level field value rather than just
 * the matched image node, so `client.patch().set()` updates the references
 * without discarding sibling data — including deeply nested image fields.
 *
 * NOTE: ported from sanity-plugin-media#236. Because of GROQ limitations the
 * matching image objects are filtered out of the document manually rather than
 * via a projection.
 */
export function findImageAssets(
  document: Record<string, unknown>,
  newAsset: Asset,
  assetToReplaceId: string,
): Record<string, unknown>[] {
  const matchedTopLevelFields = new Set<string>()
  repointNestedImages(document, newAsset, assetToReplaceId, '', matchedTopLevelFields)
  return [...matchedTopLevelFields].map((field) => ({[field]: document[field]}))
}

function repointNestedImages(
  node: unknown,
  newAsset: Asset,
  assetToReplaceId: string,
  topLevelField: string,
  matchedTopLevelFields: Set<string>,
): void {
  if (typeof node !== 'object' || node === null) {
    return
  }

  const candidate = node as ImageNode
  if (candidate._type === 'image' && candidate.asset && candidate.asset._ref === assetToReplaceId) {
    candidate.asset._ref = newAsset._id
    if (topLevelField) {
      matchedTopLevelFields.add(topLevelField)
    }
  }

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null) {
      // Once we descend past the document root, keep attributing matches to the
      // top-level field so the patch replaces that whole field.
      repointNestedImages(
        value,
        newAsset,
        assetToReplaceId,
        topLevelField || key,
        matchedTopLevelFields,
      )
    }
  }
}
