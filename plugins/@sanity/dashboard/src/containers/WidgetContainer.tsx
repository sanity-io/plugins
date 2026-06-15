import {Card} from '@sanity/ui'
import {useMemo} from 'react'

import {type DashboardWidget} from '../types'
import {useDashboardConfig} from './DashboardContext'

export function WidgetContainer(props: DashboardWidget) {
  const config = useDashboardConfig()
  const layout = useMemo(
    () => ({
      ...props.layout,
      ...config.layout,
    }),
    [props.layout, config.layout],
  )

  const Widget = props.component

  return (
    <Card shadow={1} data-width={layout.width} data-height={layout.height}>
      <Widget />
    </Card>
  )
}
