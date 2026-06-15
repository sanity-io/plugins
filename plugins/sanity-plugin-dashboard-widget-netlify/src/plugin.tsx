import {type DashboardWidget, type LayoutConfig} from '@sanity/dashboard'

import {type WidgetOptions} from './types'
import Widget from './widget'

export type NetlifyWidgetConfig = WidgetOptions & {layout?: LayoutConfig}

export function netlifyWidget(config: NetlifyWidgetConfig): DashboardWidget {
  return {
    name: 'netlify-widget',
    component: () => {
      return <Widget {...config} />
    },
    layout: config.layout ?? {width: 'medium'},
  }
}
