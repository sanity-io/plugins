import type {SanityClient} from '@sanity/client'
import type {ToastParams} from '@sanity/ui'
import {type Ref, useImperativeHandle, useState} from 'react'

import {DocumentListWrapper} from './DocumentListWrapper'
import {resetOrder} from './helpers/resetOrder'

export interface OrderableDocumentListProps {
  options: {
    type: string
    client: SanityClient
    filter?: string
    params?: Record<string, unknown>
    currentVersion?: string
  }
  ref?: Ref<OrderableDocumentListHandle>
}

export interface OrderableDocumentListHandle {
  actionHandlers: {
    showIncrements: () => void
    resetOrder: () => Promise<void>
  }
}

// The structure tool reads `actionHandlers` off the pane component's ref to wire
// up its menu items, so we expose them through `useImperativeHandle`.
export function OrderableDocumentList({options, ref}: OrderableDocumentListProps) {
  const [showIncrements, setShowIncrements] = useState(false)
  const [resetOrderTransaction, setResetOrderTransaction] = useState<ToastParams>({})

  useImperativeHandle(
    ref,
    () => ({
      actionHandlers: {
        showIncrements: () => {
          setShowIncrements((current) => !current)
        },

        resetOrder: async () => {
          setResetOrderTransaction({
            status: `info`,
            title: `Reordering started...`,
            closable: true,
          })

          const update = await resetOrder(options)

          const reorderWasSuccessful = update?.results?.length

          setResetOrderTransaction({
            status: reorderWasSuccessful ? `success` : `info`,
            title: reorderWasSuccessful
              ? `Reordered ${update.results.length === 1 ? `Document` : `Documents`}`
              : `Reordering failed`,
            closable: true,
          })
        },
      },
    }),
    [options],
  )

  const {type, filter, params, currentVersion} = options

  if (!type) {
    return null
  }

  return (
    <DocumentListWrapper
      filter={filter}
      params={params}
      type={type}
      showIncrements={showIncrements}
      resetOrderTransaction={resetOrderTransaction}
      currentVersion={currentVersion}
    />
  )
}
