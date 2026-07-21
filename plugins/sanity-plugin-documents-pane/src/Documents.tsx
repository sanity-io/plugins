import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import {useCallback} from 'react'
import {
  DefaultPreview,
  getPublishedId,
  Preview,
  useSchema,
  type ListenQueryOptions,
  type SanityDocument,
} from 'sanity'
import {Feedback, useListeningQuery} from 'sanity-plugin-utils'
import {usePaneRouter} from 'sanity/structure'

import Debug from './Debug'
import DuplicateDocument from './DuplicateDocument'
import NewDocument from './NewDocument'
import type {DocumentsPaneInitialValueTemplate} from './types'

type DocumentsProps = {
  query: string
  params: Record<string, string>
  debug: boolean
  initialValueTemplates: DocumentsPaneInitialValueTemplate[]
  options: ListenQueryOptions
  duplicate: boolean
}

export default function Documents(props: DocumentsProps) {
  const {query, params, options, debug, initialValueTemplates, duplicate} = props
  const {routerPanesState, groupIndex, handleEditReference} = usePaneRouter()
  const schema = useSchema()

  const {
    loading,
    error,
    data: _data,
  } = useListeningQuery<SanityDocument[]>(query, {
    params,
    initialValue: [],
    options,
  })
  const data = _data ?? []

  const handleClick = useCallback(
    (id: string, type: string) => {
      const childParams = routerPanesState[groupIndex + 1]?.[0]?.params || {}
      const {parentRefPath} = childParams

      handleEditReference({
        id,
        type,
        parentRefPath: parentRefPath ? pathFromString(parentRefPath) : [''],
        template: {id},
      })
    },
    [routerPanesState, groupIndex, handleEditReference],
  )

  if (loading) {
    return (
      <Box padding={4}>
        <Flex align="center" justify="center">
          <Spinner muted />
        </Flex>
      </Box>
    )
  }

  if (error) {
    return (
      <Stack gap={5} padding={4}>
        <Feedback>There was an error performing this query</Feedback>
        {debug ? <Debug params={params} query={query} /> : null}
      </Stack>
    )
  }

  if (!data.length) {
    return (
      <>
        <NewDocument initialValueTemplates={initialValueTemplates} />
        <Stack gap={4} padding={4}>
          <DocumentsCount count={0} />
          <Feedback>No Documents found</Feedback>
          {debug ? <Debug params={params} query={query} /> : null}
        </Stack>
      </>
    )
  }

  return (
    <>
      <NewDocument initialValueTemplates={initialValueTemplates} />
      <Box paddingX={3} paddingTop={3} paddingBottom={1}>
        <Box paddingLeft={1}>
          <DocumentsCount count={data.length} />
        </Box>
      </Box>
      <Stack gap={1} padding={2}>
        {data.map((doc) => {
          const schemaType = schema.get(doc._type)
          const originalId = doc['_originalId']
          const previewValue = typeof originalId === 'string' ? {...doc, _id: originalId} : doc

          return schemaType ? (
            <Button
              key={doc._id}
              mode="bleed"
              onClick={() => handleClick(doc._id, doc._type)}
              padding={2}
            >
              <Preview
                actions={
                  duplicate ? (
                    <DuplicateDocument id={getPublishedId(doc._id)} type={doc._type} />
                  ) : null
                }
                layout="block"
                schemaType={schemaType}
                value={previewValue}
              />
            </Button>
          ) : (
            <Card data-ui="Alert" key={doc._id} padding={2} radius={2} tone="caution">
              <DefaultPreview
                media={<WarningOutlineIcon />}
                subtitle={`Encountered type "${doc._type}" that is not defined in the schema.`}
                title="Unknown schema type found"
              />
            </Card>
          )
        })}
      </Stack>
    </>
  )
}

function DocumentsCount({count}: {count: number}) {
  const label = count === 1 ? 'document' : 'documents'

  return (
    <Text muted size={1}>
      {count} {label}
    </Text>
  )
}
