import {lazy} from 'react'

import type {LayoutConfig, DashboardWidget} from '../../types'

const ProjectUsers = lazy(() => import('./ProjectUsers'))

export function projectUsersWidget(config?: {layout?: LayoutConfig}): DashboardWidget {
  return {
    name: 'project-users',
    component: ProjectUsers,
    layout: config?.layout,
  }
}
