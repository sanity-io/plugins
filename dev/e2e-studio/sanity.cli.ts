import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_E2E_PROJECT_ID || 'a1psl692'
const dataset = process.env.SANITY_E2E_DATASET || 'plugins'

export default defineCliConfig({
  api: {projectId, dataset},
  vite: {
    // SANITY_E2E_* vars are not auto-exposed like SANITY_STUDIO_*; inline them
    // so sanity.config.ts can read them in the browser bundle.
    define: {
      'process.env.SANITY_E2E_PROJECT_ID': JSON.stringify(process.env.SANITY_E2E_PROJECT_ID),
      'process.env.SANITY_E2E_DATASET': JSON.stringify(process.env.SANITY_E2E_DATASET),
      'process.env.SANITY_E2E_DATASET_CHROMIUM': JSON.stringify(
        process.env.SANITY_E2E_DATASET_CHROMIUM,
      ),
      'process.env.SANITY_E2E_DATASET_FIREFOX': JSON.stringify(
        process.env.SANITY_E2E_DATASET_FIREFOX,
      ),
    },
  },
})
