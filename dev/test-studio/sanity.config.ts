import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {vercelProtectionBypassTool} from '@sanity/vercel-protection-bypass'
import {visionTool} from '@sanity/vision'
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {contentGraphView} from 'sanity-plugin-graph-view'
import {workspaceHomeConfig} from 'sanity-plugin-workspace-home'
import {structureTool} from 'sanity/structure'

import {aprimoExample} from '#aprimo'
import {assistExample} from '#assist'
import {bynderExample} from '#bynder'
import {codeInputExample} from '#code-input'
import {colorExample} from '#color'
import {debugLiveSyncTagsExample} from '#debug-live-sync-tags'
import {documentInternationalizationExample} from '#document-internationalization'
import {iframePaneExample} from '#iframe-pane'
import {
  internationalizedArrayAsyncLanguages,
  internationalizedArrayExample,
} from '#internationalized-array'
import {latexInputExample} from '#latex-input'
import {markdownExample} from '#markdown'
import {presetsWorkspace} from '#presets'
import {richDateInputExample} from '#rich-date-input'
import {scriptRunnerTool} from '#script-runner'
import {sfccExample} from '#sfcc'
import {studioSecretsExample} from '#studio-secrets'
import {unsplashExample} from '#unsplash'
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
  createWorkspace({name: 'content-graph-view', plugins: [contentGraphView()]}),
  createWorkspace({name: 'iframe-pane-example', plugins: [iframePaneExample()]}),
  createWorkspace({name: 'workflow-example', plugins: [structureTool(), workflowExample()]}),
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
    name: 'kitchen-sink',
    plugins: [
      structureTool(),
      assistExample(),
      // add new plugins here
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
])
