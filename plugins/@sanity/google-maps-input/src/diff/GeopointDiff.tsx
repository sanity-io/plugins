import {DiffFromTo, type DiffProps, type ObjectDiff} from 'sanity'

import {StaticMapDiffPreview} from './StaticMapDiffPreview'

/**
 * Diff component for `geopoint` and `geopointRadius` values. Renders a
 * before/after static map preview using `DiffFromTo`, matching the look of the
 * built-in image diff. Handles both types: the preview detects a `radius` field
 * and draws the radius circle when present.
 */
export function GeopointDiff({diff, schemaType}: DiffProps<ObjectDiff>) {
  return (
    <DiffFromTo
      diff={diff}
      schemaType={schemaType}
      previewComponent={StaticMapDiffPreview}
      layout="grid"
    />
  )
}
