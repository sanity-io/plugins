import {DashboardWidgetContainer} from '@sanity/dashboard'
import {Card, Flex, Spinner, Stack} from '@sanity/ui'
import intersection from 'lodash-es/intersection.js'
import {type ReactNode, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of, startWith} from 'rxjs'
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

type DocumentListState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'error'; error: Error}
  | {status: 'success'; documents: SanityDocument[]}

const IDLE_STATE: DocumentListState = {status: 'idle'}
const LOADING_STATE: DocumentListState = {status: 'loading'}

function DocumentList(props: DocumentListConfig): ReactNode {
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

  const state$ = useMemo(() => {
    if (!assembledQuery) {
      return of(IDLE_STATE)
    }

    return getSubscription(assembledQuery, params, versionedClient).pipe(
      map((documents) => ({
        status: 'success' as const,
        documents: documents.slice(0, limit),
      })),
      startWith(LOADING_STATE),
      catchError((error: Error) => of({status: 'error' as const, error})),
    )
  }, [limit, versionedClient, assembledQuery, params])

  const state = useObservable(state$, LOADING_STATE)
  const error = state.status === 'error' ? state.error : undefined
  const loading = state.status === 'loading' || state.status === 'idle'
  const documents = state.status === 'success' ? state.documents : undefined

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
