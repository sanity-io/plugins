import {EarthGlobeIcon} from '@sanity/icons'
import {defineField, definePlugin, defineType} from 'sanity'
import {defaultFieldLevelConfig, TranslationsTab} from 'sanity-plugin-transifex'
import type {DefaultDocumentNodeResolver} from 'sanity/structure'
import {structureTool} from 'sanity/structure'

const languages = [
  {id: 'en', title: 'English', isDefault: true},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
]

const localizedString = defineType({
  name: 'transifexLocalizedString',
  type: 'object',
  fieldsets: [
    {
      title: 'Translations',
      name: 'translations',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: languages.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
      fieldset: lang.isDefault ? undefined : 'translations',
    }),
  ),
})

const transifexTest = defineType({
  type: 'document',
  name: 'transifexTest',
  title: 'Transifex',
  icon: EarthGlobeIcon,
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'transifexLocalizedString',
      name: 'greeting',
      title: 'Greeting',
    }),
    defineField({
      type: 'transifexLocalizedString',
      name: 'description',
      title: 'Description',
    }),
  ],
})

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'transifexTest') {
    return S.document().views([
      S.view.form(),
      S.view.component(TranslationsTab).title('Transifex').options(defaultFieldLevelConfig),
    ])
  }

  return S.document().views([S.view.form()])
}

export const transifexExample = definePlugin(() => ({
  name: 'transifex-example',
  schema: {types: [localizedString, transifexTest]},
  plugins: [
    structureTool({
      defaultDocumentNode,
    }),
  ],
}))
