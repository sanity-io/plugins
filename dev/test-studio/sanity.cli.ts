import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

export default defineCliConfig({
  api: { projectId, dataset },
  deployment: { appId: 'bi1ktslqwmu1cawds5ce3jn6', autoUpdates: true },
  reactStrictMode: true,
  reactCompiler: { target: '19' },
  studioHost: 'plugins',
})
