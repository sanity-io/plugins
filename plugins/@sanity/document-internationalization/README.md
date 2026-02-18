# @sanity/document-internationalization

- [@sanity/document-internationalization](#sanitydocument-internationalization)
  - [What this plugin solves](#what-this-plugin-solves)
    - [Many projects use both](#many-projects-use-both)
  - [Upgrade](#upgrade)
  - [Install](#install)
  - [Usage](#usage)
    - [Basic configuration](#basic-configuration)
    - [Advanced configuration](#advanced-configuration)
    - [Language field](#language-field)
    - [Excluding fields](#excluding-fields)
    - [Document actions](#document-actions)
  - [Querying translations](#querying-translations)
    - [Querying with GROQ](#querying-with-groq)
    - [Querying with GraphQL](#querying-with-graphql)
  - [Note on document quotas](#note-on-document-quotas)
  - [Documentation](#documentation)
  - [License](#license)

## What this plugin solves

There are two popular methods of internationalization in Sanity Studio:

- **Document-level translation**
  - A unique document version for every language
  - Joined together by references in a `translation.metadata` document
  - Best for documents that have unique, language-specific fields and no common content across languages
- **Field-level translation**
  - A single document with many languages of content
  - Achieved by mapping over languages on each field
  - Best for documents that have a mix of language-specific and common fields

This plugin adds features to the Studio to improve handling **document-level translations**.

- A Language Selector to create and browse language-specific versions of a Document
- Hooks and components to use throughout your custom components to handle translations
- Document Badges to highlight the language version of a document

For **field-level translations** you should use the [sanity-plugin-internationalized-array](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array).

### Many projects use both

An example of **document-level** translation could be a `lesson` schema, the `title`, `slug` and `content` fields would be unique in every language.

A good use of **field-level** translation could be a `person` schema. It could have the same `name` and `image` in every language, but only the `biography` would need translating.

## Upgrade

If upgrading from a previous version (v1), please see the [upgrade documentation](https://github.com/sanity-io/document-internationalization/blob/main/docs/00-upgrade-from-v1.md) in the original repository.

### Migrating to v6

This plugin uses [sanity-plugin-internationalized-array](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array) for the `translations` array on `translation.metadata` documents. In v5, the internationalized-array plugin moved the language identifier from `_key` to a dedicated `language` field.

**If you have existing translation metadata documents**, you must run the migration to update the data format. See the [internationalized-array migration guide](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array#migrate-from-v4-to-v5).

**Important:** When configuring the migration, include `'translation.metadata'` in the document types so that your translation metadata documents are migrated:

### 1. Backup your data.

You can manually backup your data using the sanity CLI.

```
sanity dataset export production
```

This creates a production.tar.gz file in your current directory containing all your documents and assets.

You can also specify a custom filename and location:

```
sanity dataset export production ./backups/backup-2026-02-16.tar.gz
```

If you ever need to restore, use the import command:

```
sanity dataset import backup-2026-02-16.tar.gz production
```

Or you can use the backup service, read more at https://www.sanity.io/docs/content-lake/backups

### 2. Update your GROQ queries.

Use a backwards compatible query until your migration is ready and has been executed.

```diff
*[_type == "person"] {
-  "greeting": greeting[_key == "en"][0].value
+  "greeting": greeting[language == "en" || _key == "en"][0].value
}
```

### 3. Data migration

The sanity-plugin-internationalized-array package exports a migration helper that you can run with the [migration CLI](https://www.sanity.io/docs/cli-reference/cli-migration).

Create a migration file in your project and export it:

```ts
import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'

const DOCUMENT_TYPES: string[] = ['translation.metadata']
export default migrateToLanguageField(DOCUMENT_TYPES)
```

Then verify your migration with a dry run:

```bash
pnpm sanity migration run migrateToLanguageField
```

Once ready, run the migration:

```bash
pnpm sanity migration run migrateToLanguageField --no-dry-run
```

### 4. Update your GROQ queries

Previously we updated the GROQ queries to support both locations for the language field. Once migration is complete, update the GROQ queries again to only use `language` and remove the dependency on `_key`.

```diff
*[_type == "person"] {
-  "greeting": greeting[language == "en" || _key == "en"][0].value
+  "greeting": greeting[language == "en"][0].value
}
```

## Install

```bash
npm install --save @sanity/document-internationalization
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

### Basic configuration

The only required configuration is:

- The `supportedLanguages` array and
- The `schemaTypes` array

```ts
// sanity.config.ts

import {defineConfig} from 'sanity'
import {documentInternationalization} from '@sanity/document-internationalization'

export const defineConfig({
  // ... all other config
  plugins: [
    // ... all other plugins
    documentInternationalization({
      // Required configuration
      supportedLanguages: [
        {id: 'es', title: 'Spanish'},
        {id: 'en', title: 'English'}
      ],
      schemaTypes: ['lesson'],
    })
  ]
})
```

### Advanced configuration

The plugin also supports asynchronously retrieving languages from the dataset, modifying the language field, adding a bulk publishing feature and adding additional fields to the metadata document.

```ts
// sanity.config.ts

import {defineConfig} from 'sanity'
import {documentInternationalization} from '@sanity/document-internationalization'

export const defineConfig({
  // ... all other config
  plugins: [
    // ... all other plugins
    documentInternationalization({
      // Required
      // Either: an array of supported languages...
      supportedLanguages: [
        {id: 'nb', title: 'Norwegian (Bokmål)'},
        {id: 'nn', title: 'Norwegian (Nynorsk)'},
        {id: 'en', title: 'English'}
      ],
      // ...or a function that takes the client and returns a promise of an array of supported languages
      // MUST return an "id" and "title" as strings
      // Note: Async language configuration cannot create templates for new documents
      // supportedLanguages: (client) => client.fetch(`*[_type == "language"]{id, title}`),

      // Required
      // Translations UI will only appear on these schema types
      schemaTypes: ['lesson'],

      // Optional
      // Customizes the name of the language field
      languageField: `language`, // defaults to "language"

      // Optional
      // Keep translation.metadata references weak
      weakReferences: true, // defaults to false

      // Optional
      // Adds UI for publishing all translations at once. Requires access to the Scheduling API
      // https://www.sanity.io/docs/scheduling-api
      bulkPublish: true, // defaults to false

      // Optional
      // Adds additional fields to the metadata document
      metadataFields: [
        defineField({ name: 'slug', type: 'slug' }),
      ],

      // Optional
      // Define API Version for all queries
      // https://www.sanity.io/docs/api-versioning
      apiVersion: '2025-02-19',

      // Optional
      // Enable "manage translations" button without creating a translated version. Helpful if you have
      // pre-existing documents that you need to tie together through the metadata document
      allowCreateMetaDoc: true, // defaults to false

      // Optional
      // Callback function that runs after a translation document has been created
      // Note: Defaults to null
      callback: ({
        sourceDocument, // The document in the original language
        newDocument, // The newly created translation of the source document
        sourceLanguageId, // The id of the original language
        destinationLanguageId, // The id of the destination language
        metaDocumentId, // The id of the meta document referencing the document translations
        client // Sanity client
      }) {
        // Your function implementation
      },

      // Optional
      // Hides the language filter (Translations button) in the document editor toolbar.
      // The language badge will still be shown. Accepts:
      // - A boolean to hide for all types: `hideLanguageFilter: true`
      // - An array of schema type names: `hideLanguageFilter: ['lesson']`
      // - A function for dynamic control: `hideLanguageFilter: (ctx) => ctx.schemaType === 'lesson'`
      hideLanguageFilter: true, // defaults to false
    })
  ]
})
```

### Language field

The schema types that use document internationalization must also have a `string` field type with the same name configured in the `languageField` setting. Unless you want content creators to be able to change the language of a document, you may hide or disable this field since the plugin will handle writing patches to it.

```ts
// ./schema/lesson.ts

// ...all other settings
defineField({
  // should match 'languageField' plugin configuration setting, if customized
  name: 'language',
  type: 'string',
  readOnly: true,
  hidden: true,
})
```

### Excluding fields

The default behaviour of this plugin when creating a new translation is to duplicate the originating document, which is useful for then translating the fields directly in the new document - perhaps with [Sanity AI Assist](https://github.com/sanity-io/assist). However, sometimes you may want to exclude certain fields from being copied to the new document. You can do this by updating your schema to exclude certain types or fields with `options.documentInternationalization.exclude`:

```ts
defineField({
  name: 'title',
  title: 'Title',
  type: 'string',
  options: {
    documentInternationalization: {
      exclude: true,
    },
  },
}),
```

### Document actions

This package exports hook-based document actions that you can add in your Studio `document.actions` configuration:

- `useDeleteTranslationAction`
- `useDuplicateWithTranslationsAction`

The legacy action exports `DeleteTranslationAction` and `DuplicateWithTranslationsAction` are deprecated.

```ts
import {
  useDeleteTranslationAction,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'

export default defineConfig({
  // ... all other config
  document: {
    actions: (prev, context) => {
      const translatedSchemaTypes = ['lesson', 'article']

      if (translatedSchemaTypes.includes(context.schemaType)) {
        return [...prev, useDeleteTranslationAction, useDuplicateWithTranslationsAction]
      }

      return prev
    },
  },
})
```

## Querying translations

### Querying with GROQ

To query a single document and all its translations, we use the `references()` function in GROQ.

```json5
// All `lesson` documents of a single language
*[_type == "lesson" && language == $language]{
  title,
  slug,
  language,
  // Get the translations metadata
  // And resolve the `value` reference field in each array item
  "_translations": *[_type == "translation.metadata" && references(^._id)].translations[].value->{
    title,
    slug,
    language
  },
}
```

### Querying with GraphQL

Fortunately, the Sanity GraphQL API contains a similar filter for document references.

```graphql
# In this example we retrieve a lesson by its `slug.current` field value
query GetLesson($language: String!, $slug: String!) {
  allLesson(limit: 1, where: {language: {eq: $language}, slug: {current: {eq: $slug}}}) {
    _id
    title
    language
    slug {
      current
    }
  }
}

# And then can run this query to find translation metadata documents that use its ID
query GetTranslations($id: ID!) {
  allTranslationMetadata(where: {_: {references: $id}}) {
    translations {
      _key
      value {
        title
        slug {
          current
        }
      }
    }
  }
}
```

## Note on document quotas

In previous versions of this plugin, translations were stored as an array of references on the actual documents. This required a base language, lead to messy transaction histories and made deleting documents difficult.

In this version of the plugin, translations of a document are stored as an array of references in a separate document of the type `translation.metadata`, and one is created for every document that has translations. A document with no translations will not have a metadata document.

This means if you have 100 documents and they are all translated into 3 languages, you will have 400 documents. Keep this in mind for extremely high-volume datasets.

## Documentation

For more advanced topics see the [original repository documentation](https://github.com/sanity-io/document-internationalization/tree/main/docs).

- [Upgrade from v1](https://github.com/sanity-io/document-internationalization/blob/main/docs/00-upgrade-from-v1.md)
- [Creating translations of singleton documents](https://github.com/sanity-io/document-internationalization/blob/main/docs/01-singleton-documents.md)
- [Importing and creating documents](https://github.com/sanity-io/document-internationalization/blob/main/docs/02-importing-and-creating-documents.md)
- [Deleting translated documents](https://github.com/sanity-io/document-internationalization/blob/main/docs/03-deleting-translated-documents.md)
- [Importing plugin components](https://github.com/sanity-io/document-internationalization/blob/main/docs/04-importing-plugin-components.md)
- [Allowing the same slug on different language versions](https://github.com/sanity-io/document-internationalization/blob/main/docs/05-allowing-the-same-slug-for-translations.md)
- [Remove default new document template](https://github.com/sanity-io/document-internationalization/blob/main/docs/06-remove-default-new-document-template.md)

## License

[MIT](LICENSE) © Sanity.io
