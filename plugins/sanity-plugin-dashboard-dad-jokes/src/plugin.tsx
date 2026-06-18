import type {DashboardWidget, LayoutConfig} from '@sanity/dashboard'

import Jokes from './Jokes'

export interface JokesWidgetConfig {
  layout?: LayoutConfig
}

export function jokesWidget(config: JokesWidgetConfig = {}): DashboardWidget {
  return {
    name: 'jokes-widget',
    component: function component() {
      return <Jokes />
    },
    layout: config.layout ?? {width: 'medium'},
  }
}
