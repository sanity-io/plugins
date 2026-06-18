import {dashboardTool} from '@sanity/dashboard'
import {definePlugin} from 'sanity'
import {jokesWidget} from 'sanity-plugin-dashboard-dad-jokes'

export const jokesWidgetExample = definePlugin(() => ({
  plugins: [
    dashboardTool({
      name: 'dad-jokes',
      title: 'Dad Jokes',
      widgets: [jokesWidget({layout: {width: 'medium'}})],
    }),
  ],
}))
