import {colorInput} from '@sanity/color-input'
import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {aprimoPlugin} from 'sanity-plugin-aprimo'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {workspaceHomeConfig} from 'sanity-plugin-workspace-home'
import {structureTool} from 'sanity/structure'

import aprimoInputSchema from './src/aprimo-input'
import colorInputSchema from './src/color-input'

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
  createWorkspace({
    name: 'kitchen-sink',
    schema: {
      types: [colorInputSchema, aprimoInputSchema],
    },
    plugins: [
      structureTool(),
      colorInput(),
      debugSecrets(),
      vercelProtectionBypassTool(),
      aprimoPlugin({tenantName: 'partner1'}),
      visionTool(),
    ],
  }),
])
