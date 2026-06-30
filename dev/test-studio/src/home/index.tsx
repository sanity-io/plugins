import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'

import {documentsPaneDefaultDocumentNode} from '#documents-pane'
import {hierarchicalDocumentListDeskItems} from '#hierarchical-document-list'
import {iframePaneDefaultDocumentNode} from '#iframe-pane'
import {orderableDocumentListDeskItems} from '#orderable-document-list'
import {sanityNaiveHtmlSerializerDefaultDocumentNode} from '#sanity-naive-html-serializer'
import {smartlingDefaultDocumentNode} from '#smartling'
import {transifexDefaultDocumentNode} from '#transifex'
import {translationsTabDefaultDocumentNode} from '#translations-tab'

// Document types grouped by the Studio API the plugin implements. Items inside
// each group are ordered alphabetically by their plugin/document title. Any
// document type not listed here falls through to the catch-all at the bottom of
// the structure, so nothing ever disappears from the studio.

const INPUT_PLUGIN_TYPES = [
  'asyncListTest', // @sanity/sanity-plugin-async-list
  'codeTest', // @sanity/code-input
  'colorTest', // @sanity/color-input
  'embeddingsArticle', // @sanity/embeddings-index-ui
  'form', // @sanity/form-toolkit
  'googleMapsTest', // @sanity/google-maps-input
  'hotspotArrayDemo', // sanity-plugin-hotspot-array
  'latexTest', // sanity-plugin-latex-input
  'markdownTest', // sanity-plugin-markdown
  'personalizationTest', // @sanity/personalization-plugin
  'corePresetsTest', // @sanity/presets
  'richDateTest', // @sanity/rich-date-input
  'tableTest', // @sanity/table
]

const ASSET_SOURCE_TYPES = [
  'aprimoTest', // sanity-plugin-aprimo
  'bynderTest', // sanity-plugin-bynder-input
  'cloudinaryTest', // sanity-plugin-cloudinary
  'mediaProduct', // sanity-plugin-media
  'muxTrailer', // sanity-plugin-mux-input
  'shopifyAssetsTest', // sanity-plugin-shopify-assets
  'unsplashPost', // sanity-plugin-asset-source-unsplash
]

const CUSTOM_PANE_TYPES = [
  'documentsPaneArticle', // sanity-plugin-documents-pane
  'iframeExample', // sanity-plugin-iframe-pane
  'naiveHtmlSerializerArticle', // sanity-naive-html-serializer
]

const INTERNATIONALIZATION_TYPES = [
  'lesson', // @sanity/document-internationalization
  'translation.metadata', // @sanity/document-internationalization
  'googleTranslateTest', // sanity-plugin-google-translate
  'internationalizedPost', // sanity-plugin-internationalized-array
  'i18nArrayPerformanceTest', // sanity-plugin-internationalized-array
  'i18nArrayCircularSchemaRepro', // sanity-plugin-internationalized-array
  'movieDocument', // sanity-plugin-internationalized-array
  'issue520Repro', // sanity-plugin-internationalized-array
  'smartlingTest', // sanity-plugin-studio-smartling
  'transifexTest', // sanity-plugin-transifex
  'translatable', // sanity-translations-tab
]

// Explicitly placed in the (untitled) catch-all section, ahead of the leftovers.
const MISC_NAMED_TYPES = [
  'assist.instruction.context', // @sanity/assist (AI context)
  'media.tag', // sanity-plugin-media (Media Tag)
]

// Surfaced through the "Document list builders" folder via desk-item helpers,
// so they should not also appear in the catch-all.
const DESK_BUILDER_TYPES = [
  'hierarchyAuthor', // @sanity/hierarchical-document-list
  'hierarchyBook', // @sanity/hierarchical-document-list
  'hierarchyTree', // @sanity/hierarchical-document-list
  'orderableCategory', // @sanity/orderable-document-list
  'orderableProject', // @sanity/orderable-document-list
]

/**
 * Structure for the `home` workspace: a single Structure tool that organizes the
 * merged "kitchen sink" of plugins into sections by the Studio API they
 * implement (input plugins, asset sources, custom panes, document-list builders,
 * internationalization), with a catch-all for everything else.
 */
export const homeStructure: StructureResolver = (S, context) => {
  const exists = (type: string) => Boolean(context.schema.get(type))
  const itemsFor = (types: string[]) =>
    types.filter(exists).map((type) => S.documentTypeListItem(type))

  const folder = (id: string, title: string, types: string[]) =>
    S.listItem()
      .id(id)
      .title(title)
      .child(S.list().title(title).items(itemsFor(types)))

  const placed = new Set<string>([
    ...INPUT_PLUGIN_TYPES,
    ...ASSET_SOURCE_TYPES,
    ...CUSTOM_PANE_TYPES,
    ...INTERNATIONALIZATION_TYPES,
    ...MISC_NAMED_TYPES,
    ...DESK_BUILDER_TYPES,
  ])

  const leftovers = S.documentTypeListItems().filter((item) => {
    const id = item.getId()
    return id ? !placed.has(id) : false
  })

  return S.list()
    .title('Content')
    .items([
      S.divider().title('Plugins'),
      folder('input-plugins', 'Input plugins', INPUT_PLUGIN_TYPES),
      folder('asset-source-plugins', 'Asset source plugins', ASSET_SOURCE_TYPES),
      folder('custom-panes', 'Custom panes', CUSTOM_PANE_TYPES),
      S.listItem()
        .id('document-list-builders')
        .title('Document list builders')
        .child(
          S.list()
            .title('Document list builders')
            .items([
              ...hierarchicalDocumentListDeskItems(S, context),
              S.divider(),
              ...orderableDocumentListDeskItems(S, context),
            ]),
        ),
      S.divider().title('Internationalization'),
      ...itemsFor(INTERNATIONALIZATION_TYPES),
      S.divider(),
      ...itemsFor(MISC_NAMED_TYPES),
      ...leftovers,
    ])
}

// Per-type document views contributed by the folded "custom pane" plugins. Each
// fragment returns a document node for the types it owns, or `null` otherwise,
// so the first match wins and everything else uses the default form view.
const documentNodeFragments: DefaultDocumentNodeResolver[] = [
  documentsPaneDefaultDocumentNode,
  iframePaneDefaultDocumentNode,
  sanityNaiveHtmlSerializerDefaultDocumentNode,
  smartlingDefaultDocumentNode,
  transifexDefaultDocumentNode,
  translationsTabDefaultDocumentNode,
]

export const homeDefaultDocumentNode: DefaultDocumentNodeResolver = (S, context) => {
  for (const fragment of documentNodeFragments) {
    const node = fragment(S, context)
    if (node) return node
  }
  return undefined
}
