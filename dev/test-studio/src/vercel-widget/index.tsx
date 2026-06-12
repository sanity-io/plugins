import {definePlugin} from 'sanity'
import {vercelWidget} from 'sanity-plugin-dashboard-widget-vercel'

export const vercelWidgetExample = definePlugin(() => ({
  plugins: [vercelWidget()],
}))
