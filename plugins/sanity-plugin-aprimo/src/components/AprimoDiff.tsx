import {DiffFromTo, type SchemaType} from 'sanity'

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
