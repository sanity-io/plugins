import {type LayoutConfig, type DashboardWidget} from '../../types'
import {SanityTutorials} from './SanityTutorials'

export function sanityTutorialsWidget(config?: {layout?: LayoutConfig}): DashboardWidget {
  return {
    name: 'sanity-tutorials',
    component: SanityTutorials,
    layout: config?.layout ?? {width: 'full'},
  }
}
