import {Card, Text} from '@sanity/ui'
import {
  definePlugin,
  defineType,
  defineField,
  defineArrayMember,
  type ObjectInputProps,
} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {structureTool} from 'sanity/structure'

import {issue520Repro} from './issue-520-repro'

const internationalizedPost = defineType({
  type: 'document',
  name: 'internationalizedPost',
  title: 'Internationalized Post',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      options: {
        aiAssist: {
          translateAction: true,
        },
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
      options: {
        aiAssist: {
          translateAction: true,
        },
      },
    }),
    // ---------------------------------------------------------------------
    // Issue #886 — verifying how to set initialValue on internationalized
    // array fields. Create a new `internationalizedPost` document and
    // compare these two greeting fields side by side:
    //   - issue886UsersSetup: no initialValue (the reporter's current setup).
    //     Renders as an empty array; only the "Add language" buttons show.
    //   - issue886SuggestedInitialValue: standard Sanity `initialValue` shaped
    //     to match the stored item shape, i.e. each row is
    //     { _key, language, value, _type: 'internationalizedArray<Type>Value' }.
    //     Renders pre-filled with "en" → "Hello" and "fr" → "Bonjour",
    //     both editable.
    // ---------------------------------------------------------------------
    defineField({
      name: 'issue886UsersSetup',
      title: 'Greeting (user setup, no initialValue) — issue #886',
      description:
        "The reporter's current setup: no initialValue. New docs render an empty array with only the Add-language buttons.",
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'issue886SuggestedInitialValue',
      title: 'Greeting (suggested initialValue) — issue #886',
      description:
        'With the suggested initialValue shape, new docs render pre-filled with "en" → "Hello" and "fr" → "Bonjour".',
      type: 'internationalizedArrayString',
      initialValue: [
        {
          _key: 'en',
          _type: 'internationalizedArrayStringValue',
          language: 'en',
          value: 'Hello',
        },
        {
          _key: 'fr',
          _type: 'internationalizedArrayStringValue',
          language: 'fr',
          value: 'Bonjour',
        },
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      description: 'description',
    },
    prepare(selection) {
      const {title, description} = selection
      return {
        title: title?.[0]?.value || 'Untitled',
        subtitle: description?.[0]?.value || 'No description',
      }
    },
  },
})

const person = defineType({
  name: 'i18nArrayPerformanceTest',
  title: 'I18n Array Performance Test',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'age',
      title: 'Age',
      type: 'number',
    }),
    ...Array.from({length: 30}, (_, i) =>
      defineField({
        name: 'field_' + i,
        type: 'internationalizedArrayString',
      }),
    ),
  ],
})

const bodyContent = defineType({
  name: 'i18nArrayCircularBodyContent',
  title: 'I18n Array Circular Body Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'object',
      name: 'tabs',
      fields: [
        defineField({
          name: 'tabs',
          title: 'Tabs',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'tab',
              fields: [
                defineField({
                  name: 'body',
                  title: 'Body',
                  type: 'i18nArrayCircularBodyContent',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

const circularSchemaRepro = defineType({
  name: 'i18nArrayCircularSchemaRepro',
  title: 'I18n Array Circular Schema Repro',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'i18nArrayCircularBodyContent',
    }),
  ],
})

const movie = defineType({
  name: 'movieDocument',
  title: 'Movie',
  type: 'document',
  fields: [
    defineField({
      name: 'table',
      title: 'Table',
      type: 'internationalizedArrayTable',
      description: 'Table content',
    }),
  ],
  preview: {
    select: {
      title: 'text',
    },
    prepare(selection) {
      const {title} = selection
      return {
        title: title ? title[0]?.value : 'No title',
      }
    },
  },
})

const CustomInput = (props: ObjectInputProps) => {
  return (
    <Card padding={1} border>
      <Text size={1} muted>
        Wrapping with a custom input
      </Text>
      {props.renderDefault(props)}
    </Card>
  )
}

const table = defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  components: {
    input: CustomInput,
  },
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'description', type: 'internationalizedArrayString'}),
  ],
})

export const internationalizedArrayExample = definePlugin(() => ({
  schema: {
    types: [
      internationalizedPost,
      person,
      bodyContent,
      circularSchemaRepro,
      table,
      movie,
      issue520Repro,
    ],
  },
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
        {id: 'pt', title: 'Portuguese'},
        {id: 'it', title: 'Italian'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text', 'table'],
      buttonLocations: ['document', 'field'],
      languageFilter: {
        documentTypes: ['internationalizedPost', 'lesson'],
        defaultLanguages: ['en'],
      },
    }),
  ],
}))

export const internationalizedArrayAsyncLanguages = definePlugin(() => ({
  schema: {
    types: [
      defineType({
        name: 'language',
        title: 'Language',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'locale',
            title: 'Locale',
            type: 'slug',
            options: {
              source: 'title',
            },
          }),
          defineField({
            name: 'orderRank',
            title: 'Order Rank',
            type: 'number',
          }),
        ],
      }),
      defineType({
        name: 'page',
        title: 'Page',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'content',
            title: 'Content',
            type: 'internationalizedArrayString',
          }),
        ],
      }),
    ],
  },
  plugins: [
    internationalizedArray({
      languages: async (client) =>
        client.fetch(
          `*[_type == 'language'] | order(orderRank asc){ title, 'id': locale.current }`,
        ),
      languageDisplay: 'titleAndCode',
      fieldTypes: ['string'],
      languageFilter: {
        documentTypes: ['page'],
      },
    }),
    structureTool(),
  ],
}))
