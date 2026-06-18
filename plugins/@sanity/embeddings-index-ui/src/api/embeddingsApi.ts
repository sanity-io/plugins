import {SanityClient} from 'sanity'

export interface NamedIndex {
  indexName: string
  dataset: string
  project: string
  projection: string
  filter: string
}

export interface IndexState extends NamedIndex {
  status: string
  startDocumentCount: number
  remainingDocumentCount: number
  failedDocumentCount: number
}

export interface QueryResult {
  score: number
  value: {
    documentId: string
    type: string
  }
}

export interface QueryConfig {
  query: string
  indexName: string
  maxResults?: number
  filter?: {
    type?: string | string[]
  }
}

export function queryIndex(queryConfig: QueryConfig, client: SanityClient): Promise<QueryResult[]> {
  const {query, indexName, maxResults, filter} = queryConfig
  const projectId = client.config().projectId
  const dataset = client.config().dataset
  const queryString = query?.trim()

  return client.request<QueryResult[]>({
    method: 'POST',
    url: `/embeddings-index/query/${dataset}/${indexName}?projectId=${projectId}`,
    body: {
      query: queryString,
      maxResults,
      filter,
    },
  })
}

export function getIndexes(client: SanityClient): Promise<IndexState[]> {
  const projectId = client.config().projectId
  const dataset = client.config().dataset
  return client.request<IndexState[]>({
    method: 'GET',
    url: `/embeddings-index/${dataset}?projectId=${projectId}`,
  })
}

export function deleteIndex(indexName: string, client: SanityClient): Promise<IndexState> {
  const projectId = client.config().projectId
  const dataset = client.config().dataset
  return client.request<IndexState>({
    method: 'DELETE',
    url: `/embeddings-index/${dataset}/${indexName}?projectId=${projectId}`,
  })
}
