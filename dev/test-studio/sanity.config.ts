import aprimoInputSchema from '#aprimo-input'
import {bynderTest} from '#bynder-input'
import colorInputSchema from '#color-input'
import {markdownTest} from '#markdown-input'
import {colorInput} from '@sanity/color-input'
import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {aprimoPlugin} from 'sanity-plugin-aprimo'
import {bynderInputPlugin} from 'sanity-plugin-bynder-input'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {markdownSchema} from 'sanity-plugin-markdown'
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
  createWorkspace({
    name: 'kitchen-sink',
    schema: {
      types: [colorInputSchema, aprimoInputSchema, bynderTest, markdownTest],
    },
    plugins: [
      structureTool(),
      colorInput(),
      debugSecrets(),
      markdownSchema(),
      bynderInputPlugin({
        portalConfig: {url: 'https://wave-trial.getbynder.com/'},
        compactViewOptions: {language: 'en_US'},
      }),
      vercelProtectionBypassTool(),
      aprimoPlugin({tenantName: 'partner1'}),
      visionTool(),
    ],
  }),
])
