import {defineField, definePlugin, defineType} from 'sanity'
import {googleTranslate} from 'sanity-plugin-google-translate'

const languages = [
  {id: 'en', title: 'English', isDefault: true},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
]

const localizedString = defineType({
  name: 'localizedString',
  type: 'object',
  options: {
    translate: true,
    apiKey: 'DEMO_KEY',
  },
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

const googleTranslateTest = defineType({
  type: 'document',
  name: 'googleTranslateTest',
  title: 'Google Translate',
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'localizedString',
      name: 'greeting',
      title: 'Greeting',
    }),
    defineField({
      type: 'localizedString',
      name: 'description',
      title: 'Description',
    }),
  ],
})

export const googleTranslateExample = definePlugin(() => ({
  schema: {types: [localizedString, googleTranslateTest]},
  plugins: [googleTranslate()],
}))
