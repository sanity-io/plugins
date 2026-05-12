import {CodeIcon} from '@sanity/icons'
import {lazy} from 'react'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

const ScriptRunnerTool = lazy(() => import('./ScriptRunnerTool'))

export const scriptRunnerTool = definePlugin(() => ({
  name: 'test-studio-script-runner',
  tools: [
    {
      name: 'scripts',
      title: 'Scripts',
      icon: CodeIcon,
      component: ScriptRunnerTool,
      router: route.create('/:scriptName'),
    },
  ],
}))
