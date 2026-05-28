import {Box, Flex, Container, Spinner, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useListeningQuery, Feedback} from 'sanity-plugin-utils'

import {DraggableList} from './DraggableList'
import {ORDER_FIELD_NAME} from './helpers/constants'
import {getFilteredDedupedDocs} from './helpers/getFilteredDedupedDocs'
import {getDocumentQuery, type DocumentListQueryProps} from './helpers/query'
import type {SanityDocumentWithOrder} from './types'

export function DocumentListQuery(props: DocumentListQueryProps) {
  const [listIsUpdating, setListIsUpdating] = useState(false)

  const {query, queryParams} = getDocumentQuery(props)

  const {
    data: _queryData,
    loading,
    error,
  } = useListeningQuery<SanityDocumentWithOrder[]>(query, {
    params: queryParams,
    initialValue: [],
  })

  const queryData = useMemo(() => (Array.isArray(_queryData) ? _queryData : []), [_queryData])

  const data = useMemo(
    () => getFilteredDedupedDocs(queryData, props.currentVersion),
    [props.currentVersion, queryData],
  )

  const unorderedDataCount = useMemo(
    () => data.filter((doc) => !doc[ORDER_FIELD_NAME]).length,
    [data],
  )

  if (loading) {
    return (
      <Flex style={{width: `100%`, height: `100%`}} align="center" justify="center">
        <Spinner />
      </Flex>
    )
  }

  if (error) {
    return (
      <Box padding={2}>
        <Feedback tone="critical" title="There was an error" description="Please try again later" />
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Flex align="center" direction="column" height="fill" justify="center">
        <Container width={1}>
          <Box paddingX={4} paddingY={5}>
            <Text align="center" muted>
              No documents of this type
            </Text>
          </Box>
        </Container>
      </Flex>
    )
  }

  return (
    <Stack gap={1} style={{overflow: `auto`, height: `100%`}}>
      <Box padding={2}>
        {unorderedDataCount > 0 && (
          <Box marginBottom={2}>
            <Feedback
              tone="caution"
              description={
                <>
                  {unorderedDataCount}/{data.length} documents have no order. Select{' '}
                  <strong>Reset Order</strong> from the menu above to fix.
                </>
              }
            />
          </Box>
        )}
        <DraggableList
          data={data}
          listIsUpdating={listIsUpdating}
          setListIsUpdating={setListIsUpdating}
        />
      </Box>
    </Stack>
  )
}
