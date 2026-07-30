import {
  documentInternationalization,
  useDeleteTranslationAction,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'
import {TranslateIcon} from '@sanity/icons/Translate'
import {Box, Card, Code, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo} from 'react'
import {definePlugin, defineField, defineType, useClient, useSchema} from 'sanity'
import type {SanityDocument} from 'sanity'
// The TranslationsTab component is provided by the Transifex plugin (a re-export of
// the one from sanity-translations-tab).
import {TranslationsTab} from 'sanity-plugin-transifex'
// `baseDocumentLevelConfig` drives the document-level translation flow: it serializes
// the whole document (via sanity-naive-html-serializer), and on import creates a
// translated document and links it through a `translation.metadata` document — the
// same metadata @sanity/document-internationalization manages.
import {baseDocumentLevelConfig} from 'sanity-translations-tab'
import {
  structureTool,
  type DefaultDocumentNodeResolver,
  type UserViewComponent,
} from 'sanity/structure'

import {demoAdapter} from './demoAdapter'
import {serializeDocumentForTranslation} from './serializeDocument'

const SECRETS_DOCUMENT_ID = 'translationService.secrets'
const BASE_LANGUAGE = 'en'

const localizedPage = defineType({
  name: 'docI18nLocalizedPage',
  title: 'Localized Page',
  type: 'document',
  icon: TranslateIcon,
  fields: [
    defineField({
      // Managed by @sanity/document-internationalization
      name: 'language',
      title: 'Language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Not translated — shared across all language versions.',
    }),
  ],
  preview: {
    select: {title: 'title', language: 'language'},
    prepare({title, language}) {
      return {
        title: title || 'Untitled page',
        subtitle: language ? language.toUpperCase() : undefined,
      }
    },
  },
})

/*
 * Document-level translation config wired with the offline demo adapter.
 * `baseDocumentLevelConfig` already targets `baseLanguage: 'en'` and the
 * `translationService` secrets namespace; we just swap the adapter.
 *
 * For a real Transifex integration use:
 *   import {TransifexAdapter} from 'sanity-plugin-transifex'
 *   {...baseDocumentLevelConfig, adapter: TransifexAdapter, secretsNamespace: 'transifex'}
 */
const translationsTabConfig = {
  ...baseDocumentLevelConfig,
  adapter: demoAdapter,
  localeIdAdapter: (localeId: string) => localeId,
}

/*
 * Shows the serialized translation payload for the document, so it's easy to confirm
 * which fields are sent for translation (and that the image is excluded).
 */
const SerializedHtmlView: UserViewComponent = ({document}) => {
  const schema = useSchema()
  const doc = document.displayed

  const serialized = useMemo(() => {
    if (!doc?._id || !doc._type) return null
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- document views receive partial drafts until saved
    const sanityDoc = doc as SanityDocument
    return serializeDocumentForTranslation(schema, sanityDoc, BASE_LANGUAGE)
  }, [schema, doc])

  if (!serialized) {
    return (
      <Card padding={4}>
        <Text>Add some content to preview the serialized translation payload.</Text>
      </Card>
    )
  }

  return (
    <Box padding={4} height="fill">
      <Stack gap={4} height="fill">
        <Text size={1} weight="semibold">
          Serialized translation payload
        </Text>
        <Card
          border
          padding={3}
          radius={2}
          style={{flex: 1, minHeight: 0, overflow: 'auto'}}
          tone="transparent"
        >
          <Code
            language="html"
            size={1}
            style={{margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}
          >
            {serialized.content}
          </Code>
        </Card>
      </Stack>
    </Box>
  )
}

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'docI18nLocalizedPage') {
    return S.document().views([
      S.view.form(),
      S.view.component(TranslationsTab).title('Translations').options(translationsTabConfig),
      S.view.component(SerializedHtmlView).title('Serialized HTML'),
    ])
  }

  return S.document().views([S.view.form()])
}

/*
 * Seeds dummy translation-service secrets so the Translations tab is usable
 * immediately, without filling in the secrets form.
 */
function SeedTranslationSecrets() {
  const client = useClient({apiVersion: '2024-01-01'})

  useEffect(() => {
    void client.fetch('*[_id == $id][0]', {id: SECRETS_DOCUMENT_ID}).then((existing) => {
      if (existing) return undefined

      return client.createOrReplace({
        _id: SECRETS_DOCUMENT_ID,
        _type: 'translationService.secrets',
        organization: 'demo-org',
        project: 'demo-project',
      })
    })
  }, [client])

  return null
}

export const documentInternationalizationTranslationExample = definePlugin(() => ({
  name: 'document-internationalization-translation-example',
  schema: {types: [localizedPage]},
  document: {
    actions: (prev, {schemaType}) => {
      if (schemaType === 'docI18nLocalizedPage') {
        return [...prev, useDeleteTranslationAction, useDuplicateWithTranslationsAction]
      }
      return prev
    },
  },
  plugins: [
    documentInternationalization({
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
      ],
      schemaTypes: ['docI18nLocalizedPage'],
      metadataInternationalization: {
        languageDisplay: 'titleAndCode',
      },
    }),
    structureTool({defaultDocumentNode}),
  ],
  studio: {
    components: {
      layout: (props) => (
        <>
          <SeedTranslationSecrets />
          {props.renderDefault(props)}
        </>
      ),
    },
  },
}))
