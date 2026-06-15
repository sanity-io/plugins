import {dashboardTool} from '@sanity/dashboard'
import {definePlugin} from 'sanity'
import {vercelWidget} from 'sanity-plugin-dashboard-widget-vercel'

export const vercelWidgetExample = definePlugin(() => ({
  plugins: [
    dashboardTool({
      name: 'vercel-widget',
      title: 'Vercel',
      widgets: [vercelWidget()],
    }),
  ],
}))
