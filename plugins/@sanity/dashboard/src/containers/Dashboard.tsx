import {DashboardLayout} from '../components/DashboardLayout'
import {WidgetGroup} from '../components/WidgetGroup'
import {type DashboardConfig} from '../types'
import {DashboardContext} from './DashboardContext'

export function Dashboard({config}: {config: DashboardConfig}) {
  if (!config) {
    return null
  }

  return (
    <DashboardContext.Provider value={config}>
      <DashboardLayout>
        <WidgetGroup config={config} />
      </DashboardLayout>
    </DashboardContext.Provider>
  )
}
