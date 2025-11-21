import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

export default defineConfig({
  projectId,
  dataset,
  title: 'Plugins Studio',
  plugins: [structureTool(), vercelProtectionBypassTool(), visionTool()],
})
