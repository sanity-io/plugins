import {LayoutConfig, DashboardWidget} from '../../types'
import {ProjectUsers} from './ProjectUsers'

export function projectUsersWidget(config?: {layout?: LayoutConfig}): DashboardWidget {
  return {
    name: 'project-info',
    component: ProjectUsers,
    layout: config?.layout,
  }
}
