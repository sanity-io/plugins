import axios from 'axios'

import type {ShopifyAPIResponse} from '../types'

export interface FetchAssetsProps {
  projectId: string
  dataset: string
  shop: string
  query: string
  cursor: string
  resultsPerPage: number
  token?: string
}

export async function fetchAssets(props: FetchAssetsProps): Promise<ShopifyAPIResponse> {
  const {projectId, dataset, shop, query, cursor, resultsPerPage, token} = props

  const searchParams = new URLSearchParams({
    shop,
    limit: `${resultsPerPage}`,
  })
  if (query.trim()) {
    searchParams.set('query', query.trim())
  }
  if (cursor) {
    searchParams.set('cursor', cursor)
  }

  const url = `https://${projectId}.api.sanity.io/v1/shopify/assets/${dataset}?${searchParams}`

  const result = await axios.get<ShopifyAPIResponse>(url, {
    withCredentials: true,
    method: 'GET',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  })

  return result.data
}
