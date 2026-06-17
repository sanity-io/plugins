import {lazy} from 'react'

import type {LayoutConfig, DashboardWidget} from '../../types'

const SanityTutorials = lazy(() => import('./SanityTutorials'))

export function sanityTutorialsWidget(config?: {layout?: LayoutConfig}): DashboardWidget {
  return {
    name: 'sanity-tutorials',
    component: SanityTutorials,
    layout: config?.layout ?? {width: 'full'},
  }
}
