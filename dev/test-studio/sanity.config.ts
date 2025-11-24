import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

export default defineConfig({
  projectId,
  dataset,
  title: 'Plugins Studio',
  plugins: [structureTool(), debugSecrets(), vercelProtectionBypassTool(), visionTool()],
})
