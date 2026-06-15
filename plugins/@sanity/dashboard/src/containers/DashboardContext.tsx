import {createContext, useContext} from 'react'

import {type DashboardConfig} from '../types'

export const DashboardContext = createContext<DashboardConfig>({widgets: []})

export function useDashboardConfig(): DashboardConfig {
  return useContext(DashboardContext)
}
