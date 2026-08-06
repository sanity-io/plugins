import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {mergeConfig, type UserConfig} from 'vite'

const projectId = process.env.SANITY_E2E_PROJECT_ID || 'a1psl692'
const dataset = process.env.SANITY_E2E_DATASET || 'plugins'
const chromiumDataset = process.env.SANITY_E2E_DATASET_CHROMIUM || dataset
const firefoxDataset = process.env.SANITY_E2E_DATASET_FIREFOX || dataset

export default defineCliConfig({
  api: {projectId, dataset},
  vite(viteConfig): UserConfig {
    return mergeConfig(viteConfig, {
      // Required so plugins styled with vanilla-extract (e.g. sanity-plugin-media)
      // have their `.css.ts` files compiled to real CSS instead of failing at
      // runtime with "Styles were unable to be assigned to a file".
      plugins: [vanillaExtractPlugin()],
      // SANITY_E2E_* vars are not auto-exposed like SANITY_STUDIO_*; inline them
      // so sanity.config.ts can read them in the browser bundle.
      // Always stringify concrete fallbacks — `JSON.stringify(undefined)` is not a
      // valid Vite `define` value and leaves the studio without a project id.
      define: {
        'process.env.SANITY_E2E_PROJECT_ID': JSON.stringify(projectId),
        'process.env.SANITY_E2E_DATASET': JSON.stringify(dataset),
        'process.env.SANITY_E2E_DATASET_CHROMIUM': JSON.stringify(chromiumDataset),
        'process.env.SANITY_E2E_DATASET_FIREFOX': JSON.stringify(firefoxDataset),
      },
    } satisfies UserConfig)
  },
})
