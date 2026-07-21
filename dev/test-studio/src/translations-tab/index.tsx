import {TranslateIcon} from '@sanity/icons/Translate'
import {useEffect} from 'react'
import {definePlugin, defineType, useClient} from 'sanity'
import {
  DummyAdapter,
  TranslationsTab,
  type ExportForTranslation,
  type ImportTranslation,
} from 'sanity-translations-tab'
import type {DefaultDocumentNodeResolver} from 'sanity/structure'

const SECRETS_DOCUMENT_ID = 'translationService.secrets'

const translatableDocument = defineType({
  name: 'translatable',
  type: 'document',
  title: 'Translatable Document',
  icon: TranslateIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
    },
  ],
})

const exportForTranslation: ExportForTranslation = async (id, context) => {
  const doc = await context.client.getDocument(id)
  return {
    name: doc?._type ?? 'translatable',
    content: JSON.stringify(doc ?? {}),
  }
}

const importTranslation: ImportTranslation = async () => {
  return undefined
}

export const translationsTabDefaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  {schemaType},
) => {
  if (schemaType === 'translatable') {
    return S.document().views([
      S.view.form(),
      S.view
        .component(TranslationsTab)
        .title('Translations')
        .options({
          adapter: DummyAdapter,
          secretsNamespace: 'translationService',
          exportForTranslation,
          importTranslation,
          workflowOptions: [
            {
              workflowUid: '123',
              workflowName: 'Machine Translation (testing)',
            },
          ],
          localeIdAdapter: (translationVendorId: string) => translationVendorId,
          baseLanguage: 'en_US',
        }),
    ])
  }

  return null
}

function SeedTranslationSecrets() {
  const client = useClient({apiVersion: '2024-01-01'})

  useEffect(() => {
    void client.fetch('*[_id == $id][0]', {id: SECRETS_DOCUMENT_ID}).then((doc) => {
      if (doc) return undefined

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

export const translationsTabExample = definePlugin(() => ({
  name: 'translations-tab-example',
  schema: {types: [translatableDocument]},
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
