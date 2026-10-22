import {nanoid} from 'nanoid'

import type {SanityReference, TagItem, TagSelectOption} from '../types'

type TagReference = SanityReference & {_key?: string}

/**
 * The tag references to save for the tags picked in the asset form. Saving only removes tags the
 * form showed, so references to tags that hadn't loaded, failed to load or resolved once the tags
 * were being edited stay as they are. Picked tags that no longer exist aren't added, and existing
 * references keep their `_key`.
 */
export function mergeTagReferences({
  picked,
  references,
  shown,
  tagsById,
}: {
  picked: TagSelectOption[] | null | undefined
  references: TagReference[] | undefined
  /** The asset's tags as the form showed them before they were edited. */
  shown: TagSelectOption[] | null
  tagsById: Record<string, TagItem>
}): TagReference[] | null {
  const pickedIds = new Set((picked ?? []).flatMap(({value}) => (value in tagsById ? [value] : [])))
  const removedIds = new Set(
    (shown ?? []).flatMap(({value}) => (pickedIds.has(value) ? [] : [value])),
  )
  const kept = (references ?? []).filter(({_ref}) => !removedIds.has(_ref))
  const keptIds = new Set(kept.map(({_ref}) => _ref))
  const added = [...pickedIds]
    .filter((tagId) => !keptIds.has(tagId))
    .map((tagId): TagReference & {_key: string} => ({
      _key: nanoid(),
      _ref: tagId,
      _type: 'reference',
      _weak: true,
    }))
  const merged = [...kept, ...added]
  return merged.length > 0 ? merged : null
}
