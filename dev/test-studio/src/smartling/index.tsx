import {EarthGlobeIcon} from '@sanity/icons'
import {defineField, definePlugin, defineType} from 'sanity'
import {defaultFieldLevelConfig, TranslationsTab} from 'sanity-plugin-studio-smartling'
import type {DefaultDocumentNodeResolver} from 'sanity/structure'
import {structureTool} from 'sanity/structure'

const languages = [
  {id: 'en', title: 'English', isDefault: true},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
]

const localizedString = defineType({
  name: 'smartlingLocalizedString',
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

const smartlingTest = defineType({
  type: 'document',
  name: 'smartlingTest',
  title: 'Smartling',
  icon: EarthGlobeIcon,
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'smartlingLocalizedString',
      name: 'greeting',
      title: 'Greeting',
    }),
    defineField({
      type: 'smartlingLocalizedString',
      name: 'description',
      title: 'Description',
    }),
  ],
})

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'smartlingTest') {
    return S.document().views([
      S.view.form(),
      S.view.component(TranslationsTab).title('Smartling').options(defaultFieldLevelConfig),
    ])
  }

  return S.document().views([S.view.form()])
}

export const smartlingExample = definePlugin(() => ({
  name: 'smartling-example',
  schema: {types: [localizedString, smartlingTest]},
  plugins: [
    structureTool({
      defaultDocumentNode,
    }),
  ],
}))
