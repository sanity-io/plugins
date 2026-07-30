import type {SanityClient} from '@sanity/client'
import type {ToastParams} from '@sanity/ui'
import {useImperativeHandle, useState, type Ref} from 'react'

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
  /**
   * Structure menu actions look up `actionHandlers` on the pane component
   * instance. Expose them via `useImperativeHandle`.
   */
  ref?: Ref<{
    actionHandlers: {
      showIncrements: () => void
      resetOrder: () => Promise<void>
    }
  }>
}

export function OrderableDocumentList({options, ref}: OrderableDocumentListProps) {
  const [showIncrements, setShowIncrements] = useState(false)
  const [resetOrderTransaction, setResetOrderTransaction] = useState<ToastParams>({})

  useImperativeHandle(
    ref,
    () => ({
      actionHandlers: {
        showIncrements: () => {
          setShowIncrements((state) => !state)
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
      // The pane stores this handle in state, so only re-create it when needed
      // to avoid update loops.
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
