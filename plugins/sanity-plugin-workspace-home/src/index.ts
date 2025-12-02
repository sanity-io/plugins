import {HomeIcon} from '@sanity/icons'
import {definePlugin, type WorkspaceOptions} from 'sanity'

import WorkspaceHome from './components/WorkspaceHome'

export const workspaceHome = definePlugin(() => {
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
