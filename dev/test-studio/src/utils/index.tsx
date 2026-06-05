import {UsersIcon} from '@sanity/icons'
import {Card, Spinner, Stack, Text} from '@sanity/ui'
import {definePlugin} from 'sanity'
import {Feedback, useListeningQuery, useProjectUsers} from 'sanity-plugin-utils'
import {route} from 'sanity/router'

type UtilsDemoDocument = {
  _id: string
  title?: string
}

function UtilsDemoTool() {
  const {data, loading, error} = useListeningQuery<UtilsDemoDocument[]>(
    `*[_type == "utilsDemoDocument"] | order(_updatedAt desc)[0...10]{_id, title}`,
    {initialValue: []},
  )
  const users = useProjectUsers({apiVersion: '2023-01-01'})

  return (
    <Card padding={4} sizing="border">
      <Stack gap={5}>
        <Feedback
          tone="primary"
          title="sanity-plugin-utils"
          description="Handy hooks and components for Sanity Studio plugins."
        />

        <Stack gap={3}>
          <Text weight="semibold" size={2}>
            useListeningQuery
          </Text>
          {loading ? (
            <Spinner />
          ) : error ? (
            <Feedback tone="critical">Failed to load documents</Feedback>
          ) : data && data.length > 0 ? (
            <Stack gap={2}>
              {data.map((doc) => (
                <Card key={doc._id} padding={3} border radius={2}>
                  <Text>{doc.title || doc._id}</Text>
                </Card>
              ))}
            </Stack>
          ) : (
            <Feedback tone="caution">No utilsDemoDocument entries found yet.</Feedback>
          )}
        </Stack>

        <Stack gap={3}>
          <Text weight="semibold" size={2}>
            useProjectUsers
          </Text>
          {users.length > 0 ? (
            <Feedback tone="positive">{`${users.length} project users loaded`}</Feedback>
          ) : (
            <Spinner />
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

export const utilsExample = definePlugin(() => ({
  name: 'test-studio-utils-example',
  schema: {
    types: [
      {
        type: 'document',
        name: 'utilsDemoDocument',
        title: 'Utils Demo Document',
        fields: [{type: 'string', name: 'title', title: 'Title'}],
      },
    ],
  },
  tools: [
    {
      name: 'utils-demo',
      title: 'Utils Demo',
      icon: UsersIcon,
      component: UtilsDemoTool,
      router: route.create('/'),
    },
  ],
}))
