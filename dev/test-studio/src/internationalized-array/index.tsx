import {languageFilter} from '@sanity/language-filter'
import {Card, Text} from '@sanity/ui'
import {
  definePlugin,
  defineType,
  defineField,
  isKeySegment,
  defineArrayMember,
  type ObjectInputProps,
} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
  ],
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
    types: [internationalizedPost, person, bodyContent, circularSchemaRepro, table, movie],
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
    }),
    languageFilter({
      documentTypes: ['internationalizedPost', 'lesson'],
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
        {id: 'fr', title: 'French'},
        {id: 'de', title: 'German'},
        {id: 'pt', title: 'Portuguese'},
        {id: 'it', title: 'Italian'},
      ],
      filterField: (enclosingType, member, selectedLanguageIds) => {
        // Filter internationalized arrays - follows readme example
        if (
          enclosingType.jsonType === 'object' &&
          enclosingType.name.startsWith('internationalizedArray') &&
          'kind' in member
        ) {
          // Get last two segments of the field's path
          const pathEnd = member.field.path.slice(-2)
          // If the second-last segment is a _key, and the last segment is `value`,
          // It's an internationalized array value
          // And the array _key is the language of the field
          const language =
            pathEnd[1] === 'value' && isKeySegment(pathEnd[0]) ? pathEnd[0]._key : null

          return language ? selectedLanguageIds.includes(language) : false
        }

        // Filter internationalized objects if you have them
        // `localeString` must be registered as a custom schema type
        if (enclosingType.jsonType === 'object' && enclosingType.name.startsWith('locale')) {
          return selectedLanguageIds.includes(member.name)
        }

        return true
      },
    }),
  ],
}))
