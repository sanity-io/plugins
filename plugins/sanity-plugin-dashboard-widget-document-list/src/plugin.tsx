import type {DashboardWidget, LayoutConfig} from '@sanity/dashboard'
import {lazy} from 'react'

import type {DocumentListConfig} from './DocumentList'

const DocumentList = lazy(() => import('./DocumentList'))

export interface DocumentListWidgetConfig extends DocumentListConfig {
  layout?: LayoutConfig
}

export function documentListWidget(config: DocumentListWidgetConfig): DashboardWidget {
  return {
    name: 'document-list-widget',
    component: function component() {
      return <DocumentList {...config} />
    },
    layout: config.layout,
  }
}
