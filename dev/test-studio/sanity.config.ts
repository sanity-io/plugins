import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {workspaceHomeConfig} from 'sanity-plugin-workspace-home'
import {structureTool} from 'sanity/structure'

import {aprimoExample} from '#aprimo'
import {assistExample} from '#assist'
import {asyncListExample} from '#async-list'
import {bynderExample} from '#bynder'
import {codeInputExample} from '#code-input'
import {colorExample} from '#color'
import {dashboardToolExample} from '#dashboard-tool'
import {debugLiveSyncTagsExample} from '#debug-live-sync-tags'
import {documentInternationalizationExample} from '#document-internationalization'
import {documentInternationalizationTranslationExample} from '#document-internationalization-translation'
import {documentListWidgetExample} from '#document-list-widget'
import {documentsPaneExample} from '#documents-pane'
import {googleTranslateExample} from '#google-translate'
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
// issue-1153 verify: import `media` directly so we can wire up two side-by-side
// workspaces (one with the suggested `__experimental_omnisearch_visibility`
// callback applied to `media.tag`, one without) without disturbing the
// `mediaExample` plugin that the rest of test-studio depends on.
import {media as mediaPluginForIssue1153} from 'sanity-plugin-media'
import {muxInputExample} from '#mux-input'
import {netlifyWidgetExample} from '#netlify-widget'
import {
  orderableDocumentListExample,
  orderableDocumentListExampleStructure,
} from '#orderable-document-list'
import {presetsWorkspace} from '#presets'
import {richDateInputExample} from '#rich-date-input'
import {sanityNaiveHtmlSerializerExample} from '#sanity-naive-html-serializer'
import {scriptRunnerTool} from '#script-runner'
import {sfccExample} from '#sfcc'
import {studioSecretsExample} from '#studio-secrets'
import {tableExample} from '#table'
import {transifexExample} from '#transifex'
import {translationsTabExample} from '#translations-tab'
import {unsplashExample} from '#unsplash'
import {utilsExample} from '#utils'
import {vercelWidgetExample} from '#vercel-widget'
import {workflowExample} from '#workflow'

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
  createWorkspace({
    name: 'naive-html-serializer-example',
    title: 'Naive HTML Serializer',
    plugins: [sanityNaiveHtmlSerializerExample()],
  }),
  createWorkspace({name: 'content-graph-view', plugins: [contentGraphView()]}),
  createWorkspace({name: 'utils-example', title: 'Utils Example', plugins: [utilsExample()]}),
  createWorkspace({name: 'iframe-pane-example', plugins: [iframePaneExample()]}),
  createWorkspace({name: 'transifex-example', title: 'Transifex', plugins: [transifexExample()]}),
  createWorkspace({name: 'documents-pane-example', plugins: [documentsPaneExample()]}),
  createWorkspace({
    name: 'translations-tab-example',
    title: 'Translations Tab',
    plugins: [translationsTabExample()],
  }),
  createWorkspace({
    name: 'i18n-array-translation-example',
    title: 'i18n Array Translation',
    plugins: [i18nArrayTranslationExample()],
  }),
  createWorkspace({
    name: 'doc-i18n-translation-example',
    title: 'Doc i18n + Translations',
    plugins: [documentInternationalizationTranslationExample()],
  }),
  createWorkspace({name: 'workflow-example', plugins: [structureTool(), workflowExample()]}),
  createWorkspace({
    name: 'orderable-document-list-example',
    title: 'Orderable Document List',
    plugins: [orderableDocumentListExample(), orderableDocumentListExampleStructure()],
  }),
  createWorkspace({
    name: 'presets-studio',
    title: 'Presets Studio',
    plugins: [structureTool(), presetsWorkspace()],
  }),
  createWorkspace({
    name: 'sfcc-example',
    title: 'Salesforce Commerce Cloud',
    plugins: [sfccExample()],
  }),
  createWorkspace({
    name: 'dashboard-example',
    title: 'Dashboard',
    plugins: [
      structureTool(),
      dashboardToolExample(),
      documentListWidgetExample(),
      netlifyWidgetExample(),
      vercelWidgetExample(),
    ],
  }),
  createWorkspace({
    name: 'kitchen-sink',
    plugins: [
      structureTool(),
      assistExample(),
      googleTranslateExample(),
      mediaExample(),
      // add new plugins here
      muxInputExample(),
      asyncListExample(),
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
      debugSecrets(),
      unsplashExample(),
      scriptRunnerTool(),
      vercelProtectionBypassTool(),
      visionTool(),
    ],
  }),
  createWorkspace({
    name: 'internationalized-array-async-languages',
    plugins: [internationalizedArrayAsyncLanguages()],
  }),
  // -----------------------------------------------------------------------
  // sanity-io/plugins#1153 verify - "Exclude `media.tag` from search"
  //
  // The user (issue #1153) wants to hide the plugin-injected `media.tag`
  // document from Studio global search (Cmd/Ctrl+K). The plugin doesn't
  // expose a `MediaToolOptions` flag for this and the schema in
  // plugins/sanity-plugin-media/src/schemas/tag.ts has no
  // `__experimental_omnisearch_visibility: false` of its own.
  //
  // The drafted reply tells them to map over `prev` in `schema.types` and
  // tag the `media.tag` entry themselves. These two workspaces verify that
  // claim. Switch between them in the Studio sidebar and open global
  // search to compare:
  //
  //   - `issue-1153-default`: plain `media()` plugin (user's status quo).
  //     Global search filter list includes "Media Tag"; `media.tag`
  //     documents show up in results.
  //
  //   - `issue-1153-hidden`: same `media()` plugin plus the `schema.types`
  //     callback from the drafted reply. Global search filter list should
  //     NOT include "Media Tag" and tag docs should NOT appear in results.
  // -----------------------------------------------------------------------
  createWorkspace({
    name: 'issue-1153-default',
    title: '#1153 default (media.tag visible)',
    plugins: [structureTool(), mediaPluginForIssue1153()],
  }),
  createWorkspace({
    name: 'issue-1153-hidden',
    title: '#1153 hidden (media.tag excluded from search)',
    plugins: [structureTool(), mediaPluginForIssue1153()],
    schema: {
      types: (prev) =>
        prev.map((type) =>
          type.name === 'media.tag'
            ? {...type, __experimental_omnisearch_visibility: false}
            : type,
        ),
    },
  }),
])
