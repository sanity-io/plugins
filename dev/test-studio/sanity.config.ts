import {defineConfig} from 'sanity'

import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

export default defineConfig({
  projectId,
  dataset,
  title: 'Plugins Studio',
  plugins: [vercelProtectionBypassTool()],
})
