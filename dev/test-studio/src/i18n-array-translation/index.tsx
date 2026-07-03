import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {Box, Card, Code, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo} from 'react'
import {definePlugin, defineField, defineType, useClient, useSchema} from 'sanity'
import type {SanityDocument} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
// The TranslationsTab component comes from the Transifex plugin (it re-exports the
// one from sanity-translations-tab). To send content to a real Transifex project,
// import {TransifexAdapter} from 'sanity-plugin-transifex' and pass
// `.options({...baseI18nArrayConfig, adapter: TransifexAdapter, secretsNamespace: 'transifex'})`.
import {TranslationsTab} from 'sanity-plugin-transifex'
// `baseI18nArrayConfig` drives the "internationalized array" translation level, which
// uses `sanity-naive-html-serializer` under the hood to serialize/merge the localized
// arrays. We swap in a small offline `demoAdapter` so the full export/import round
// trip works without a real translation vendor.
import {baseI18nArrayConfig} from 'sanity-translations-tab'
import {
  structureTool,
  type DefaultDocumentNodeResolver,
  type UserViewComponent,
} from 'sanity/structure'

import {demoAdapter} from './demoAdapter'
import {serializeForTranslation} from './serializeForTranslation'

const SECRETS_DOCUMENT_ID = 'translationService.secrets'
const BASE_LANGUAGE = 'en'

/*
 * Internationalized-array translation config wired with the offline demo adapter.
 * `baseI18nArrayConfig` already targets `baseLanguage: 'en'` and the
 * `translationService` secrets namespace; we just swap the adapter.
 *
 * For a real Transifex integration use:
 *   import {TransifexAdapter} from 'sanity-plugin-transifex'
 *   {...baseI18nArrayConfig, adapter: TransifexAdapter, secretsNamespace: 'transifex'}
 */
const translationsTabConfig = {
  ...baseI18nArrayConfig,
  adapter: demoAdapter,
  localeIdAdapter: (localeId: string) => localeId,
}

/*
 * SEO object: title + description are translated (internationalized arrays, new
 * `language` field format), the image is NOT sent for translation.
 */
const localizedSeo = defineType({
  name: 'localizedSeo',
  title: 'SEO',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'description',
      title: 'SEO description',
      type: 'internationalizedArrayText',
    }),
    defineField({
      name: 'image',
      title: 'SEO image',
      type: 'image',
      description: 'Not translated — the same image is shared across all languages.',
    }),
  ],
})

const localizedArticle = defineType({
  name: 'localizedArticle',
  title: 'Localized Article',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'localizedSeo',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title?.[0]?.value || 'Untitled article'}
    },
  },
})

/*
 * Renders the document serialized for translation at the `internationalizedArray`
 * level. This is the exact payload sent to the translation vendor, so it's an easy
 * way to confirm that base-language strings from the new `language` field format are
 * picked up (and that the image is excluded).
 */
const SerializedHtmlView: UserViewComponent = ({document}) => {
  const schema = useSchema()
  const doc = document.displayed

  const serialized = useMemo(() => {
    if (!doc?._id || !doc._type) return null
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- document views receive partial drafts until saved
    const sanityDoc = doc as SanityDocument
    return serializeForTranslation(schema, sanityDoc, BASE_LANGUAGE)
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
  if (schemaType === 'localizedArticle') {
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

export const i18nArrayTranslationExample = definePlugin(() => ({
  name: 'i18n-array-translation-example',
  schema: {types: [localizedArticle, localizedSeo]},
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'de', title: 'German'},
        {id: 'no_nb', title: 'Norwegian (Bokmål)'},
        {id: 'is', title: 'Icelandic'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text'],
      buttonLocations: ['field'],
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
