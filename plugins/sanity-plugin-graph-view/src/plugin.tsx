import {lazy} from 'react'
import { type Plugin} from 'sanity'
import {route} from 'sanity/router'

import {GraphViewIcon} from './tool/GraphViewIcon'

export interface GraphViewConfig {
  query?: string
}

const GraphView = lazy(() => import('./tool/GraphView'))

export const contentGraphView: Plugin<void | GraphViewConfig> = (config = {}) => {
    return {
      name: '@sanity/content-graph-view',

      tools: [
        {
          name: 'graph-your-content',
          title: 'Graph',
          icon: GraphViewIcon,
          component: GraphView,
          options: config,
          router: route.create('/:selectedDocumentId'),
        },
      ],
    }
  }
