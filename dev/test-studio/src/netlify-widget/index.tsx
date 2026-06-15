import {dashboardTool} from '@sanity/dashboard'
import {definePlugin} from 'sanity'
import {netlifyWidget} from 'sanity-plugin-dashboard-widget-netlify'

export const netlifyWidgetExample = definePlugin(() => ({
  plugins: [
    dashboardTool({
      name: 'netlify-widget',
      title: 'Netlify',
      widgets: [
        netlifyWidget({
          title: 'My Netlify deploys',
          sites: [
            {
              title: 'Sanity Studio',
              apiId: 'xxxxx-yyyy-zzzz-xxxx-yyyyyyyy',
              buildHookId: 'xxxyyyxxxyyyyxxxyyy',
              name: 'sanity-gatsby-blog-20-studio',
            },
            {
              title: 'Website',
              apiId: 'yyyyy-xxxxx-zzzz-xxxx-yyyyyyyy',
              buildHookId: 'yyyyxxxxxyyyxxdxxx',
              name: 'sanity-gatsby-blog-20-web',
              url: 'https://my-sanity-deployment.com',
            },
          ],
        }),
      ],
    }),
  ],
}))
