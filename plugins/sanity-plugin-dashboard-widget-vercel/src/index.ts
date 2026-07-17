import type {DashboardWidget, LayoutConfig} from '@sanity/dashboard'

import Widget from './app'

export function vercelWidget(config: {layout?: LayoutConfig} = {}): DashboardWidget {
  return {
    name: 'vercel',
    component: Widget,
    layout: config.layout ?? {width: 'full'},
  }
}
