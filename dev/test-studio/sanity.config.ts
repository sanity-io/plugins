import {aprimoExample} from '#aprimo'
import {bynderExample} from '#bynder'
import {colorExample} from '#color'
import {markdownExample} from '#markdown'
import {singletonToolsExample} from '#singleton-tools'
import {workflowExample} from '#workflow'
import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {workspaceHomeConfig} from 'sanity-plugin-workspace-home'
import {structureTool} from 'sanity/structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

function createWorkspace(
  config: Omit<WorkspaceOptions, 'projectId' | 'dataset' | 'basePath'>,
): WorkspaceOptions {
  return {
    projectId,
    dataset,
    ...config,
    basePath: `/${config.name}`,
  }
}

export default defineConfig([
  workspaceHomeConfig({projectId, dataset}),
  createWorkspace({name: 'content-graph-view', plugins: [contentGraphView()]}),
  createWorkspace({name: 'workflow-example', plugins: [structureTool(), workflowExample()]}),
  createWorkspace({
    name: 'kitchen-sink',
    plugins: [
      structureTool(),
      aprimoExample(),
      bynderExample(),
      colorExample(),
      markdownExample(),
      debugSecrets(),
      // add new plugins here

      singletonToolsExample(),
      vercelProtectionBypassTool(),
      visionTool(),
    ],
  }),
])
