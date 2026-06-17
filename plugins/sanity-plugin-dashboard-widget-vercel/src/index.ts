import {type DashboardWidget, type LayoutConfig} from '@sanity/dashboard'
// Initialize `javascript-time-ago` locale (required for react-time-ago)
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import {lazy} from 'react'

const Widget = lazy(() => import('./app'))

TimeAgo.addDefaultLocale(en)

export function vercelWidget(config: {layout?: LayoutConfig} = {}): DashboardWidget {
  return {
    name: 'vercel',
    component: Widget,
    layout: config.layout ?? {width: 'full'},
  }
}
