import {definePlugin, type Plugin, type WorkspaceOptions} from 'sanity'

import {HomeIcon} from '@sanity/icons'

import WorkspaceHome from './components/WorkspaceHome'

export const workspaceHome: Plugin = definePlugin(() => {
  return {
    name: 'sanity-plugin-workspace-home',
    tools: [
      {
        title: 'Workspace Home',
        name: 'workspace-home',
        icon: HomeIcon,
        component: WorkspaceHome,
      },
    ],
  }
})

type WorkspaceHomeConfigProps = {
  projectId: string
  dataset: string
}

export const workspaceHomeConfig = ({
  projectId = ``,
  dataset = ``,
}: WorkspaceHomeConfigProps): WorkspaceOptions => ({
  name: 'home',
  title: 'Home',
  basePath: '/home',
  projectId,
  dataset,
  icon: HomeIcon,
  plugins: [workspaceHome()],
})
