import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {HomeIcon} from '@sanity/icons/Home'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {workspaceHome} from 'sanity-plugin-workspace-home'
import {structureTool} from 'sanity/structure'

import {aprimoExample} from '#aprimo'
import {assistExample} from '#assist'
import {asyncListExample} from '#async-list'
import {blockInsertPickerExample} from '#block-insert-picker'
import {bynderExample} from '#bynder'
import {cloudinaryExample} from '#cloudinary'
import {codeInputExample} from '#code-input'
import {colorExample} from '#color'
import {crossDatasetDuplicatorExample} from '#cross-dataset-duplicator'
import {dashboardToolExample} from '#dashboard-tool'
import {debugLiveSyncTagsExample} from '#debug-live-sync-tags'
import {documentInternationalizationExample} from '#document-internationalization'
import {documentInternationalizationTranslationExample} from '#document-internationalization-translation'
import {documentListWidgetExample} from '#document-list-widget'
import {documentsPaneExample} from '#documents-pane'
import {embeddingsIndexUiExample} from '#embeddings-index-ui'
import {formToolkitExample} from '#form-toolkit'
import {googleMapsInputExample} from '#google-maps-input'
import {googleTranslateExample} from '#google-translate'
import {hierarchicalDocumentListExample} from '#hierarchical-document-list'
import {homeDefaultDocumentNode, homeStructure} from '#home'
import {hotspotArrayExample} from '#hotspot-array'
import {i18nArrayTranslationExample} from '#i18n-array-translation'
import {iframePaneExample} from '#iframe-pane'
import {
  internationalizedArrayAsyncLanguages,
  internationalizedArrayExample,
} from '#internationalized-array'
import {latexInputExample} from '#latex-input'
import {markdownExample} from '#markdown'
import {mediaExample} from '#media'
import {muxInputExample} from '#mux-input'
import {netlifyWidgetExample} from '#netlify-widget'
import {orderableDocumentListExample} from '#orderable-document-list'
import {personalizationExample} from '#personalization'
import {presetsWorkspace} from '#presets'
import {richDateInputExample} from '#rich-date-input'
import {sanityNaiveHtmlSerializerExample} from '#sanity-naive-html-serializer'
import {scriptRunnerTool} from '#script-runner'
import {sfccExample} from '#sfcc'
import {shopifyAssetsExample} from '#shopify-assets'
import {smartlingExample} from '#smartling'
import {studioSecretsExample} from '#studio-secrets'
import {tableExample} from '#table'
import {transifexExample} from '#transifex'
import {translationsTabExample} from '#translations-tab'
import {unsplashExample} from '#unsplash'
import {utilsExample} from '#utils'
import {vercelWidgetExample} from '#vercel-widget'
import {workflowExample} from '#workflow'

const projectId =
  process.env.SANITY_E2E_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'

const e2eDatasetChromium =
  process.env.SANITY_E2E_DATASET_CHROMIUM || process.env.SANITY_E2E_DATASET || undefined
const e2eDatasetFirefox =
  process.env.SANITY_E2E_DATASET_FIREFOX || process.env.SANITY_E2E_DATASET || undefined

function createWorkspace(
  config: Omit<WorkspaceOptions, 'projectId' | 'dataset' | 'basePath'> & {
    dataset?: string
  },
): WorkspaceOptions {
  const {dataset: workspaceDataset = dataset, ...rest} = config
  return {
    projectId,
    dataset: workspaceDataset,
    ...rest,
    basePath: `/${rest.name}`,
  }
}

function createHomePlugins() {
  return [
    // Order matters for the top navigation: Workspaces Home, Structure, then
    // the most-used plugin tools first.
    workspaceHome(),
    structureTool({structure: homeStructure, defaultDocumentNode: homeDefaultDocumentNode}),
    mediaExample(),
    muxInputExample(),
    // Inputs, asset sources, panes and tools (no particular order beyond the above).
    assistExample(),
    googleTranslateExample(),
    embeddingsIndexUiExample(),
    formToolkitExample(),
    googleMapsInputExample(),
    crossDatasetDuplicatorExample(),
    hierarchicalDocumentListExample(),
    shopifyAssetsExample(),
    personalizationExample(),
    cloudinaryExample(),
    asyncListExample(),
    blockInsertPickerExample(),
    tableExample(),
    hotspotArrayExample(),
    orderableDocumentListExample(),
    latexInputExample(),
    debugLiveSyncTagsExample(),
    studioSecretsExample(),
    documentInternationalizationExample(),
    internationalizedArrayExample(),
    richDateInputExample(),
    codeInputExample(),
    aprimoExample(),
    bynderExample(),
    colorExample(),
    markdownExample(),
    unsplashExample(),
    presetsWorkspace(),
    sanityNaiveHtmlSerializerExample(),
    utilsExample(),
    iframePaneExample(),
    documentsPaneExample(),
    transifexExample(),
    smartlingExample(),
    translationsTabExample(),
    dashboardToolExample(),
    documentListWidgetExample(),
    netlifyWidgetExample(),
    vercelWidgetExample(),
    contentGraphView(),
    scriptRunnerTool(),
    debugSecrets(),
    vercelProtectionBypassTool(),
    visionTool(),
  ]
}

const workspaces: WorkspaceOptions[] = [
  // The default "Home" workspace is the merged kitchen sink. It must stay first
  // so the Workspaces Home launcher (which lists every *other* workspace) works.
  // It hosts every plugin that can coexist in one dataset/schema; the workspaces
  // below only exist because they require a different dataset or register a
  // conflicting plugin/schema configuration that cannot live alongside Home.
  createWorkspace({
    name: 'home',
    title: 'Home',
    icon: HomeIcon,
    plugins: createHomePlugins(),
  }),
]

// Ephemeral e2e browser workspaces (same plugins as Home, isolated datasets).
// Enabled when SANITY_E2E_DATASET* is set (CI / `pnpm test:e2e` webServer).
if (e2eDatasetChromium) {
  workspaces.push(
    createWorkspace({
      name: 'chromium',
      title: 'e2e: Chromium',
      icon: HomeIcon,
      dataset: e2eDatasetChromium,
      plugins: createHomePlugins(),
    }),
  )
}
if (e2eDatasetFirefox) {
  workspaces.push(
    createWorkspace({
      name: 'firefox',
      title: 'e2e: Firefox',
      icon: HomeIcon,
      dataset: e2eDatasetFirefox,
      plugins: createHomePlugins(),
    }),
  )
}

workspaces.push(
  // Re-registers `internationalizedArray` with async languages loaded from
  // documents, which cannot coexist with Home's static language config.
  createWorkspace({
    name: 'internationalized-array-async-languages',
    title: 'internationalized-array: Async Languages',
    plugins: [internationalizedArrayAsyncLanguages()],
  }),
  // Demos the translations tab at the internationalized-array level, with its own
  // `internationalizedArray` language set (en/de/no_nb/is) — conflicts with Home.
  createWorkspace({
    name: 'i18n-array-translation',
    title: 'sanity-translations-tab: i18n Array',
    plugins: [i18nArrayTranslationExample()],
  }),
  // A second `documentInternationalization` registration (for docI18nLocalizedPage)
  // that cannot coexist with Home's `lesson` configuration.
  createWorkspace({
    name: 'doc-i18n-translation',
    title: 'document-internationalization: Translations',
    plugins: [documentInternationalizationTranslationExample()],
  }),
  // Registers its own `internationalizedArray` (en_US/fr) and `product`/`category`
  // types (`product` collides with the workflow workspace).
  createWorkspace({
    name: 'sfcc',
    title: 'sfcc: Salesforce Commerce Cloud',
    plugins: [sfccExample()],
  }),
  // Defines `product`/`article`; `product` collides with the sfcc workspace.
  createWorkspace({
    name: 'workflow',
    title: 'workflow: Document Workflow',
    plugins: [structureTool(), workflowExample()],
  }),
  // Destination workspace for @sanity/cross-dataset-duplicator: uses a
  // different dataset so it can be picked as a duplication target.
  {
    projectId,
    dataset: 'test',
    name: 'cross-dataset-duplicator-target',
    title: 'cross-dataset-duplicator: Target',
    basePath: '/cross-dataset-duplicator-target',
    plugins: [structureTool(), crossDatasetDuplicatorExample()],
  },
)

export default defineConfig(workspaces)
