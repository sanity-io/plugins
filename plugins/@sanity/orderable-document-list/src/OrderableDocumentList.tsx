import type {SanityClient} from '@sanity/client'
import type {ToastParams} from '@sanity/ui'
import {Component} from 'react'

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
}

interface State {
  showIncrements: boolean
  resetOrderTransaction: ToastParams
}

// Must use a Class Component here so the actionHandlers can be called
export class OrderableDocumentList extends Component<OrderableDocumentListProps, State> {
  constructor(props: OrderableDocumentListProps) {
    super(props)
    this.state = {
      showIncrements: false,
      resetOrderTransaction: {},
    }
  }

  actionHandlers = {
    showIncrements: () => {
      this.setState((state) => ({
        showIncrements: !state.showIncrements,
      }))
    },

    resetOrder: async () => {
      this.setState(() => ({
        resetOrderTransaction: {
          status: `info`,
          title: `Reordering started...`,
          closable: true,
        },
      }))

      const update = await resetOrder(this.props.options)

      const reorderWasSuccessful = update?.results?.length

      this.setState(() => ({
        resetOrderTransaction: {
          status: reorderWasSuccessful ? `success` : `info`,
          title: reorderWasSuccessful
            ? `Reordered ${update.results.length === 1 ? `Document` : `Documents`}`
            : `Reordering failed`,
          closable: true,
        },
      }))
    },
  }

  override render() {
    const {options} = this.props
    const {type, filter, params, currentVersion} = options

    if (!type) {
      return null
    }

    return (
      <DocumentListWrapper
        filter={filter}
        params={params}
        type={type}
        showIncrements={this.state.showIncrements}
        resetOrderTransaction={this.state.resetOrderTransaction}
        currentVersion={currentVersion}
      />
    )
  }
}
