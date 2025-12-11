import {Flex, Card, Spinner} from '@sanity/ui'
import {Preview, type SanityDocument, type StringInputProps, useSchema} from 'sanity'
import {useListeningQuery, Feedback} from 'sanity-plugin-utils'

import EditButton from './EditButton'

// TODO: Update this to use the same component as the Tool
export default function Field(props: StringInputProps) {
  const schema = useSchema()
  const {
    data: _data,
    loading,
    error,
  } = useListeningQuery<SanityDocument>(`*[_id in [$id, $draftId]]|order(_updatedAt)[0]`, {
    params: {
      id: String(props.value),
      draftId: `drafts.${String(props.value)}`,
    },
  })
  // oxlint-disable-next-line no-unsafe-type-assertion
  const data = _data as SanityDocument

  if (loading) {
    return <Spinner />
  }

  const schemaType = schema.get(data?._type ?? ``)

  if (error || !data?._type || !schemaType) {
    return <Feedback tone="critical" title="Error with query" />
  }

  return (
    <Card border padding={2}>
      <Flex align="center" justify="space-between" gap={2}>
        <Preview layout="default" value={data} schemaType={schemaType} />
        <EditButton id={data._id} type={data._type} />
      </Flex>
    </Card>
  )
}
