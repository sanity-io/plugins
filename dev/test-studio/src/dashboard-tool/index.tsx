import {dashboardTool} from '@sanity/dashboard'
import {definePlugin} from 'sanity'

export const dashboardToolExample = definePlugin(() => ({
  plugins: [dashboardTool()],
}))
