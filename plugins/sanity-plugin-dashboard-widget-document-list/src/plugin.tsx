import type {DashboardWidget, LayoutConfig} from '@sanity/dashboard'

import DocumentList, {type DocumentListConfig} from './DocumentList'

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
