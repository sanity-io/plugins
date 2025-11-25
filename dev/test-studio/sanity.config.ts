import {defineConfig} from 'sanity'
import {aprimoPlugin} from 'sanity-plugin-aprimo'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {workspaceHomeConfig} from 'sanity-plugin-workspace-home'
import {structureTool} from 'sanity/structure'

import {colorInput} from '@sanity/color-input'
import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'

import aprimoInputSchema from './src/aprimo-input'
import colorInputSchema from './src/color-input'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

export default defineConfig([
  // @ts-ignore - TODO: fix this
  workspaceHomeConfig({projectId, dataset}),
  {
    projectId,
    dataset,
    basePath: '/kitchen-sink',
    name: 'kitchen-sink',
    title: 'Kitchen Sink',
    schema: {
      types: [colorInputSchema, aprimoInputSchema],
    },
    plugins: [
      structureTool(),
      // @ts-ignore - TODO: fix this
      contentGraphView(),
      // @ts-ignore - TODO: fix this
      colorInput(),
      // @ts-ignore - TODO: fix this
      debugSecrets(),
      // @ts-ignore - TODO: fix this
      vercelProtectionBypassTool(),
      // @ts-ignore - TODO: fix this
      aprimoPlugin({
        tenantName: 'partner1',
      }),
      visionTool(),
    ],
  },
])
