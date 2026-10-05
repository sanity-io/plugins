import {DashboardWidgetContainer} from '@sanity/dashboard'
import {Card, Flex, Spinner, Stack} from '@sanity/ui'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {
  getPublishedId,
  IntentButton,
  Preview,
  type SanityDocument,
  useClient,
  useSchema,
} from 'sanity'

import {assembleDocumentListQuery} from './assembleDocumentListQuery'
import {getSubscription} from './sanityConnector'

export interface DocumentListConfig {
  title?: string
  types?: string[]
  query?: string
  /** Parameters for a custom `query`. This is the documented option. */
  params?: Record<string, any>
  /** Alias of `params`, kept for configs that already use this name. */
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
  showCreateButton: true,
  apiVersion: 'v1',
}

function DocumentList(props: DocumentListConfig): ReactNode {
  const {params: paramsOption, queryParams, ...rest} = props
  const {query, limit, apiVersion, types, order, title, showCreateButton, createButtonText} = {
    ...defaultProps,
    ...rest,
  }

  const [documents, setDocuments] = useState<SanityDocument[] | undefined>()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | undefined>()

  const versionedClient = useClient({apiVersion})
  const schema = useSchema()

  const {assembledQuery, params} = useMemo(() => {
    const documentTypeNames = schema.getTypeNames().filter((typeName) => {
      const schemaType = schema.get(typeName)
      return schemaType?.type?.name === 'document'
    })

    return assembleDocumentListQuery({
      query,
      params: paramsOption,
      queryParams,
      types,
      order,
      limit,
      documentTypeNames,
    })
  }, [schema, query, paramsOption, queryParams, order, limit, types])

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
        <Stack gap={2}>
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
