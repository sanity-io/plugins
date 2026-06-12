import {DashboardWidgetContainer} from '@sanity/dashboard'
import {Card, Flex, Spinner, Stack} from '@sanity/ui'
import {intersection} from 'lodash'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {
  getPublishedId,
  IntentButton,
  Preview,
  type SanityDocument,
  useClient,
  useSchema,
} from 'sanity'

import {getSubscription} from './sanityConnector'

export interface DocumentListConfig {
  title?: string
  types?: string[]
  query?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryParams?: Record<string, any>
  order?: string
  limit?: number
  showCreateButton?: boolean
  createButtonText?: string
  apiVersion?: string
}

const defaultProps = {
  title: 'Last created',
  order: '_createdAt desc',
  limit: 10,
  queryParams: {},
  showCreateButton: true,
  apiVersion: 'v1',
}

export function DocumentList(props: DocumentListConfig): ReactNode {
  const {
    query,
    limit,
    apiVersion,
    queryParams,
    types,
    order,
    title,
    showCreateButton,
    createButtonText,
  } = {
    ...defaultProps,
    ...props,
  }

  const [documents, setDocuments] = useState<SanityDocument[] | undefined>()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | undefined>()

  const versionedClient = useClient({apiVersion})
  const schema = useSchema()

  const {assembledQuery, params} = useMemo(() => {
    if (query) {
      return {assembledQuery: query, params: queryParams}
    }

    const documentTypes = schema.getTypeNames().filter((typeName) => {
      const schemaType = schema.get(typeName)
      return schemaType?.type?.name === 'document'
    })

    return {
      assembledQuery: `*[_type in $types] | order(${order}) [0...${limit * 2}]`,
      params: {types: types ? intersection(types, documentTypes) : documentTypes},
    }
  }, [schema, query, queryParams, order, limit, types])

  useEffect(() => {
    if (!assembledQuery) {
      return
    }

    const subscription = getSubscription(assembledQuery, params, versionedClient).subscribe({
      next: (d) => {
        setDocuments(d.slice(0, limit))
        setLoading(false)
      },
      error: (e) => {
        setError(e)
        setLoading(false)
      },
    })
    // eslint-disable-next-line consistent-return
    return () => {
      subscription.unsubscribe()
    }
  }, [limit, versionedClient, assembledQuery, params])

  return (
    <DashboardWidgetContainer
      header={title}
      footer={
        types &&
        types.length === 1 &&
        showCreateButton && (
          <IntentButton
            mode="bleed"
            style={{width: '100%'}}
            // paddingX={2}
            paddingY={4}
            tone="primary"
            type="button"
            intent="create"
            params={{type: types[0]}}
            text={createButtonText || `Create new ${types[0]}`}
          />
        )
      }
    >
      <Card>
        {error && <div>{error.message}</div>}
        {!error && loading && (
          <Card padding={4}>
            <Flex justify="center">
              <Spinner muted />
            </Flex>
          </Card>
        )}
        {!error && !documents && !loading && <div>Could not locate any documents :/</div>}
        <Stack space={2}>
          {documents && documents.map((doc) => <MenuEntry key={doc._id} doc={doc} />)}
        </Stack>
      </Card>
    </DashboardWidgetContainer>
  )
}

function MenuEntry({doc}: {doc: SanityDocument}) {
  const schema = useSchema()
  const type = schema.get(doc._type)
  return (
    <Card flex={1}>
      <IntentButton
        intent="edit"
        mode="bleed"
        tooltipProps={{}}
        // padding={1}
        // radius={0}
        params={{
          type: doc._type,
          id: getPublishedId(doc._id),
        }}
        style={{width: '100%'}}
      >
        {type ? (
          <Preview layout="default" schemaType={type} value={doc} key={doc._id} />
        ) : (
          'Schema-type missing'
        )}
      </IntentButton>
    </Card>
  )
}

export default DocumentList
