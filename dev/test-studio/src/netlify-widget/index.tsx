import {definePlugin} from 'sanity'
import {netlifyWidget} from 'sanity-plugin-dashboard-widget-netlify'

export const netlifyWidgetExample = definePlugin(() => ({
  plugins: [netlifyWidget()],
}))
