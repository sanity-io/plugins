import {type DashboardWidget, type LayoutConfig} from '@sanity/dashboard'
// oxlint-disable-next-line import/no-unassigned-import
import 'react-time-ago/locale/en'

import Widget from './app'

export function vercelWidget(config: {layout?: LayoutConfig} = {}): DashboardWidget {
  return {
    name: 'vercel',
    component: Widget,
    layout: config.layout ?? {width: 'full'},
  }
}
