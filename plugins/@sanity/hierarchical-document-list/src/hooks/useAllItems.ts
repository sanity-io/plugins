import {useEffect, useReducer, useState} from 'react'
import {type SanityDocument, useClient} from 'sanity'

import type {AllItems, TreeInputOptions} from '../types'
import {isDraft, unprefixId} from '../utils/idUtils'

function getDeskFilter({referenceTo, referenceOptions}: TreeInputOptions): {
  filter: string
  params: Record<string, unknown>
} {
  const filterParts: string[] = ['_type in $docTypes']

  if (referenceOptions?.filter) {
    filterParts.push(referenceOptions.filter)
  }

  return {
    filter: filterParts.join(' && '),
    params: {
      ...referenceOptions?.filterParams,
      docTypes: referenceTo.map((schemaType) => schemaType),
    },
  }
}

type Status = 'loading' | 'success' | 'error'

type ACTIONTYPE =
  | {type: 'addOrEditItem'; item: SanityDocument}
  | {type: 'removeItem'; itemId: string}
  | {type: 'setInitialData'; items: SanityDocument[]}

function updateItemInState(state: AllItems, item: SanityDocument): AllItems {
  const newState = {...state}
  const publishedId = unprefixId(item._id)
  newState[publishedId] = {
    ...newState[publishedId],
    [isDraft(item._id) ? 'draft' : 'published']: item,
  }
  return newState
}

function allItemsReducer(state: AllItems, action: ACTIONTYPE): AllItems {
  if (action.type === 'addOrEditItem' && action.item?._id) {
    return updateItemInState(state, action.item)
  }

  if (action.type === 'removeItem') {
    const publishedId = unprefixId(action.itemId)
    return {
      ...state,
      [publishedId]: isDraft(action.itemId)
        ? // If a draft, keep only published
          {
            published: state[publishedId]?.published,
          }
        : {
            draft: state[publishedId]?.draft,
          },
    }
  }

  if (action.type === 'setInitialData') {
    return action.items.reduce(updateItemInState, {})
  }
  return state
}

export default function useAllItems(options: TreeInputOptions): {
  status: Status
  allItems: AllItems
} {
  const client = useClient({
    apiVersion: '2021-09-01',
  })
  const [status, setStatus] = useState<Status>('loading')
  const [allItems, dispatch] = useReducer(allItemsReducer, {})

  useEffect(() => {
    function handleListener(event: {type?: string; result?: SanityDocument; documentId?: string}) {
      if (event.type !== 'mutation') {
        return
      }

      if (event.result) {
        dispatch({type: 'addOrEditItem', item: event.result})
      } else if (event.documentId) {
        dispatch({type: 'removeItem', itemId: event.documentId})
      }
    }

    const {filter, params} = getDeskFilter(options)
    const query = `*[${filter}] {
      _id,
      _type,
      _updatedAt,
    }`

    async function fetchInitialData() {
      try {
        const items = await client.fetch<SanityDocument[]>(query, params)
        dispatch({type: 'setInitialData', items})
        setStatus('success')
      } catch {
        setStatus('error')
      }
    }
    void fetchInitialData()

    const listener = client.listen(query, params).subscribe(handleListener)
    return () => {
      listener.unsubscribe()
    }
  }, [client, options])

  return {
    status,
    allItems,
  }
}
