import {type LayoutConfig, type DashboardWidget} from '../../types'
import {ProjectUsers} from './ProjectUsers'

export function projectUsersWidget(config?: {layout?: LayoutConfig}): DashboardWidget {
  return {
    name: 'project-users',
    component: ProjectUsers,
    layout: config?.layout,
  }
}
