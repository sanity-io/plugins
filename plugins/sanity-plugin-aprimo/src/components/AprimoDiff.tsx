import {type SchemaType} from 'sanity'
import {DiffFromTo} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2'

import {AprimoCDNPreview} from './AprimoCDNPreview'

//@TODO: HUGE
export function AprimoDiff({
  diff,
  schemaType,
}: {
  diff: any
  schemaType: SchemaType
}): React.JSX.Element {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={AprimoCDNPreview} />
}
