import {defineConfig, defineField, defineType, type WorkspaceOptions} from 'sanity'
import {structureTool} from 'sanity/structure'

const projectId = process.env.SANITY_E2E_PROJECT_ID || 'a1psl692'
const fallbackDataset = process.env.SANITY_E2E_DATASET || 'plugins'
const chromiumDataset = process.env.SANITY_E2E_DATASET_CHROMIUM || fallbackDataset
const firefoxDataset = process.env.SANITY_E2E_DATASET_FIREFOX || fallbackDataset

// Minimal schema on purpose: plugins (and their schema types) are added to this
// studio one by one, together with the e2e tests that cover them.
const smokeTestDocument = defineType({
  name: 'smokeTestDocument',
  title: 'Smoke test document',
  type: 'document',
  fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
})

function createWorkspace(name: string, title: string, dataset: string): WorkspaceOptions {
  return {
    name,
    title,
    // Shows the ephemeral dataset (e.g. `pr-123-chromium-…`) in the navbar.
    subtitle: dataset,
    basePath: `/${name}`,
    projectId,
    dataset,
    plugins: [structureTool()],
    schema: {types: [smokeTestDocument]},
  }
}

export default defineConfig([
  createWorkspace('chromium', 'Chromium', chromiumDataset),
  createWorkspace('firefox', 'Firefox', firefoxDataset),
])
