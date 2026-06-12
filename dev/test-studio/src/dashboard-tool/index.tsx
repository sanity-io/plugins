import {
  dashboardTool,
  projectInfoWidget,
  projectUsersWidget,
  sanityTutorialsWidget,
} from '@sanity/dashboard'
import {definePlugin} from 'sanity'

export const dashboardToolExample = definePlugin(() => ({
  plugins: [
    dashboardTool({
      widgets: [
        projectInfoWidget(),
        projectUsersWidget({layout: {width: 'medium'}}),
        sanityTutorialsWidget(),
      ],
    }),
  ],
}))
