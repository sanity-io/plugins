# sanity-plugin-internationalized-array

A plugin to register array fields with a custom input component to store field values in multiple languages, queryable by using a dedicated `language` field.

![Screenshot of an internationalized input](./img/internationalized-array.png)

- [sanity-plugin-internationalized-array](#sanity-plugin-internationalized-array)
  - [Installation](#installation)
  - [Usage for simple field types](#usage-for-simple-field-types)
  - [Loading languages](#loading-languages)
  - [Configuring the "Add translation" buttons](#configuring-the-add-translation-buttons)
  - [Using complex field configurations](#using-complex-field-configurations)
  - [Creating internationalized objects](#creating-internationalized-objects)
  - [Validation of individual array items](#validation-of-individual-array-items)
  - [Usage with @sanity/language-filter](#usage-with-sanitylanguage-filter)
  - [Shape of stored data](#shape-of-stored-data)
  - [Querying data](#querying-data)
  - [Migrate from v4 to v5](#migrate-from-v4-to-v5)
  - [Migrate from objects to arrays](#migrate-from-objects-to-arrays)
    - [Why store localized field data like this?](#why-store-localized-field-data-like-this)
  - [License](#license)

## Installation

```
npm install --save sanity-plugin-internationalized-array
```

or

```
yarn add sanity-plugin-internationalized-array
```

## Usage for simple field types

Add it as a plugin in sanity.config.ts (or .js):

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

export default defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
    }),
  ],
})
```

This will register two new fields to the schema, based on the settings passed into `fieldTypes`:

- `internationalizedArrayString` an array field of:
- `internationalizedArrayStringValue` an object field, with a single `string` field inside called `value`

The above config will also create an empty array item in new documents for each language in `defaultLanguages`. This is configured globally for all internationalized array fields.

You can pass in more registered schema-type names to generate more internationalized arrays. Use them in your schema like this:

```ts
// For example, in postType.ts

fields: [
  defineField({
    name: 'greeting',
    type: 'internationalizedArrayString',
  }),
]
```

## Loading languages

Languages must be an array of objects with an `id` and `title`.

```ts
languages: [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'}
],
```

Or an asynchronous function that returns an array of objects with an `id` and `title`.

```ts
languages: async () => {
  const response = await fetch('https://example.com/languages')
  return response.json()
}
```

The async function contains a configured Sanity Client in the first parameter, allowing you to store Language options as documents. Your query should return an array of objects with an `id` and `title`.

```ts
languages: async (client) => {
  const response = await client.fetch(`*[_type == "language"]{ id, title }`)
  return response
},
```

Additionally, you can "pick" fields from a document, to pass into the query. For example, if you have a concept of "Markets" where only certain language fields are required in certain markets.

In this example, each language document has an array of strings called `markets` to declare where that language can be used. And the document being authored has a single `market` field.

```ts
select: {
  market: 'market'
},
languages: async (client, {market = ``}) => {
  const response = await client.fetch(
    `*[_type == "language" && $market in markets]{ id, title }`,
    {market}
  )
  return response
},
```

## Configuring the "Add translation" buttons

The "Add translation" buttons can be positioned in one or multiple locations by configuring `buttonLocations`:

- `field` (default) Below the internationalized array field
- `unstable__fieldAction` Inside a Field Action (currently unstable)
- `document` Above the document fields, these buttons will add a new language item to every internationalized array field that can be found at the **root of the document**. Nested internationalized arrays are not yet supported.

To control the "Add translation" button titles, configure `languageDisplay`. This also affects language field labels.

- `codeOnly` (default) Shows only the language codes (id)
- `titleOnly` Shows the language title
- `titleAndCode` Shows the language title with the code in parentheses

The "Add all languages" button can be hidden with `buttonAddAll`.

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

export default defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      // ...other config
      buttonLocations: ['field', 'unstable__fieldAction', 'document'], // default ['field']
      buttonAddAll: false, // default true
      languageDisplay: 'codeOnly', // codeOnly (default) | titleOnly | titleAndCode
    }),
  ],
})
```

## Using complex field configurations

For more control over the `value` field, you can pass a schema definition into the `fieldTypes` array.

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

 export default defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'}
      ],
      fieldTypes: [
        defineField({
          name: 'featuredProduct',
          type: 'reference',
          to: [{type: 'product'}]
          hidden: (({document}) => !document?.title)
        })
      ],
    })
  ]
})
```

This would also create two new fields in your schema.

- `internationalizedArrayFeaturedProduct` an array field of:
- `internationalizedArrayFeaturedProductValue` an object field, with a single `string` field inside called `value`

Note that the `name` key in the field gets rewritten to `value` and is instead used to name the object field.

## Creating internationalized objects

Due to how fields are created, you cannot use anonymous objects in the `fieldTypes` array. You must register the object type in your Studio's schema as an "alias type".

```ts
// ./schemas/seoType.ts

import {defineField} from 'sanity'

export const seoType = defineField({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'description', type: 'string'}),
  ],
})
```

Then in your plugin configuration settings, add the name of your alias type to the `fieldTypes` setting.

```ts
internationalizedArray({
  languages: [
    //...languages
  ],
  fieldTypes: ['seo'],
})
```

Lastly, add the field to your schema.

```ts
// ./schemas/post.ts

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'seo',
      type: 'internationalizedArraySeo',
    }),
  ],
})
```

## Validation of individual array items

You may wish to validate individual language fields for various reasons. From the internationalized array field, add a validation rule that can look through all the array items, and return item-specific validation messages at the path of that array item.

```ts
defineField({
  name: 'title',
  type: 'internationalizedArrayString',
  description: `Use fewer than 5 words.`,
  validation: (rule) =>
    rule.custom<{value: string; _type: string; _key: string}[]>((value) => {
      if (!value) {
        return 'Title is required'
      }

      const invalidItems = value.filter(
        (item) => item.value.split(' ').length > 5,
      )

      if (invalidItems.length) {
        return invalidItems.map((item) => ({
          message: `Title is too long. Must be 5 words or fewer.`,
          path: [{_key: item._key}, 'value'],
        }))
      }

      return true
    }),
}),
```

## Usage with @sanity/language-filter

If you have many languages and authors that predominately write in only a few, [@sanity/language-filter](https://github.com/sanity-io/language-filter) can be used to reduce the number of language fields shown in the document form.

![Internationalized array field filtered with language-filter](https://github.com/sanity-io/language-filter/assets/9684022/4b402520-4128-4e6e-af07-960a10be397e)

The plugin includes built-in integration with `@sanity/language-filter`.
To enable it, add `languageFilter.documentTypes` in the plugin config for the document types that should show the filter.

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

export default defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
      languageFilter: {
        documentTypes: ['internationalizedPost', 'lesson'],
      },
    }),
  ],
})
```

If you need more control, you can continue using `@sanity/language-filter` directly and pass `internationalizedArrayLanguageFilter` from this package as your `filterField`.

## Shape of stored data

The custom input contains buttons which will add new array items with a random `_key` and the language stored in a dedicated `language` field. Data returned from this array will look like this:

```json
"greeting": [
  { "_key": "abc123", "language": "en", "value": "hello" },
  { "_key": "def456", "language": "fr", "value": "bonjour" },
]
```

## Querying data

Using GROQ filters you can query for a specific language like so:

```js
*[_type == "person"] {
  "greeting": greeting[language == "en"][0].value
}
```

## Migrate from v4 to v5

v5 stores the language identifier on a dedicated `language` field instead of `_key`.

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

If you use AI agents in your code, you can copy [this skill](./skills/i18n-array-groq-query-migration/SKILL.md) to your project to guide your agents and help you with the migration.

Use this pre migration prompt

```text
Use the project skill `i18n-array-groq-query-migration` to update this repo's GROQ queries for `sanity-plugin-internationalized-array` v5.

Goal:
- Detect all query patterns where language is read from `_key` (for example `_key == "en"` or `_key == $language`).
- Keep the same language expression used in each query.

Mode: PRE-MIGRATION (backwards-compatible)
- Replace `_key == <languageExpr>` with `language == <languageExpr> || _key == <languageExpr>`.

What to do:
1) Scan the codebase for all relevant GROQ queries.
2) Update the files in place.
3) Exclude unrelated `_key` uses that are not language matching.
4) Return a concise report with:
   - files changed
   - before/after snippets
   - any ambiguous matches needing manual review.
```

### 3. Data migration

The package exports a migration helper that you can run with the [migration CLI](https://www.sanity.io/docs/cli-reference/cli-migration).

Create a migration file in your project and export it:

```ts
// ./migrations/migrateToLanguageField.ts
import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'

// Add the document types that contain internationalized arrays.
// Example: ['internationalizedPost', 'translation.metadata']
const DOCUMENT_TYPES: string[] = []

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

**If you use [@sanity/document-internationalization](https://github.com/sanity-io/plugins/tree/main/plugins/@sanity/document-internationalization):** Include `'translation.metadata'` in your migration's document types so that the `translations` array on metadata documents is migrated
And update `@sanity/document-internationalization` to `v6`

### 4. Update your GROQ queries

Previously we updated the GROQ queries to support both locations for the language field. Once migration is complete, update the GROQ queries again to only use `language` and remove the dependency on `_key`.

```groq
*[_type == "person"] {
  "greeting": greeting[language == "en"][0].value
}
```

If you use AI agents in your code, you can automate this with the project skill at `.cursor/skills/i18n-array-groq-query-migration/SKILL.md`.

### Ask your AI agent to help you

```text
# Migrate internationalized-array to v5 and document-internationalization to v6
Create and present a plan first, then wait for user confirmation before making changes.

Before running any migration steps, ask the user to create a backup and confirm it is complete. Do not proceed until backup confirmation is received.

Use this context:
- Document internationalization (v5 -> v6): https://github.com/sanity-io/plugins/blob/main/plugins/%40sanity/document-internationalization/README.md#migrating-to-v6
- Internationalized array README: https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/README.md
- Skill source to copy from: https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/skills/i18n-array-groq-query-migration/SKILL.md

Then execute this workflow:
## Pre migration:
1) Copy the `i18n-array-groq-query-migration` skill file from the provided source URL into the relevant local project skill location.
2) Use the project skill `i18n-array-groq-query-migration` in PRE-MIGRATION mode and update all legacy GROQ filters from:
   `_key == <languageExpr>`
   to:
   `language == <languageExpr> || _key == <languageExpr>`
3) Keep the same `<languageExpr>` in each query, edit files in place, and report changed files plus any ambiguous cases.
4) Add a pause here, the user should deploy this changes with the queries updated before continuing with the migration, request confirmation on this step.

## Migration:
5) Update the packages to the new versions.
6) Identify schema types that need updates by scanning schemas where internationalization is used, specifically document types that contain fields with `type` matching `internationalizedArray*`.
7) Create the migration file following the internationalized array migration guidance, using the discovered document types in the previous step.
8) If `@sanity/document-internationalization` is used, include `translation.metadata` in the migration document types and plan for upgrading `@sanity/document-internationalization` to `v6`.
9) Ask the user to run the migration as dry run first, then non-dry-run only after confirmation.
10) Stop and ask the user to confirm the migration completed successfully before proceeding to post-migration query cleanup.
11) Ask the user to deploy the changes.

## Post migration.
11) After migration is confirmed complete, use the project skill in POST-MIGRATION mode.
12) Update all GROQ queries from:
   `language == <languageExpr> || _key == <languageExpr>`
   to:
   `language == <languageExpr>`
13) Keep the same `<languageExpr>` in each query, edit files in place, and report changed files plus any ambiguous cases.

Report:
- The approved plan
- Backup confirmation status
- Changed query files
- Discovered schema types for migration
- The created migration file path and summary of what it migrates
```

## Usage with language filter

The plugin now includes built-in integration with `@sanity/language-filter`.
To enable it, add `languageFilter.documentTypes` in the plugin config for the document types that should show the filter.

```ts
import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

export default defineConfig({
  // ...
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
      languageFilter: {
        documentTypes: ['internationalizedPost', 'lesson'],
      },
    }),
  ],
})
```

## Migrate from objects to arrays

[See the migration script](./migrations/transformObjectToArray.ts) inside `./migrations/transformObjectToArray.ts` of this plugin.

Follow the instructions inside the script and set the `_type` and field name you wish to target.

Please take a backup first!

### Why store localized field data like this?

The most popular way to store field-level translated content is in an object using the method prescribed in [@sanity/language-filter](https://www.npmjs.com/package/@sanity/language-filter). This works well and creates tidy object structures, but also creates a unique field path for every unique field name, multiplied by the number of languages in your dataset.

For most people, this won't become an issue. On a very large dataset with a lot of languages, the [Attribute Limit](https://www.sanity.io/docs/attribute-limit) can become a concern. This plugin's arrays will use fewer attributes than an object once you have more than three languages.

The same content as above, plus a third language, structured as an `object` of `string` fields looks like this:

```json
"greeting" {
  "en": "hello",
  "fr": "bonjour",
  "es": "hola"
}
```

Which creates four unique query paths, one for the object and one for each language.

```
greeting
greeting.en
greeting.fr
greeting.es
```

Every language you add to every object that uses this structure will add to the number of unique query paths.

The array created by this plugin creates four query paths by default, but is not affected by the number of languages:

```
greeting
greeting[]
greeting[]._key
greeting[].value
```

By using this plugin you can safely extend the number of languages without adding any additional query paths.

## License

[MIT](LICENSE) © Simeon Griggs
