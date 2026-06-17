import {lazy} from 'react'

import type {LayoutConfig, DashboardWidget} from '../../types'

const ProjectInfo = lazy(() => import('./ProjectInfo'))

export function projectInfoWidget(config?: {layout?: LayoutConfig}): DashboardWidget {
  return {
    name: 'project-info',
    component: ProjectInfo,
    layout: config?.layout ?? {width: 'medium'},
  }
}
