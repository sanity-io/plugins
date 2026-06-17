import {type ComponentClass, type FunctionComponent} from 'react'

export interface DashboardWidget {
  name: string
  type?: '__experimental_group'
  component: FunctionComponent<any> | ComponentClass<any>
  layout?: LayoutConfig
  widgets?: DashboardWidget[]
}

export type LayoutSize = 'auto' | 'small' | 'medium' | 'large' | 'full'

export interface LayoutConfig {
  width?: LayoutSize
  height?: LayoutSize
}

export interface DashboardConfig {
  widgets: DashboardWidget[]
  layout?: LayoutConfig
}

export interface DashboardWidgetProps {
  header?: string
  children: React.ReactNode
  footer?: React.ReactNode
}
