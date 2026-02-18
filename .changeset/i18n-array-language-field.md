---
"sanity-plugin-internationalized-array": major
---

Move language identifier from `_key` to dedicated `language` field.

**Breaking change**: Internationalized array items now store the language identifier in a `language` field instead of `_key`. The `_key` field is now a random unique ID.

**Before (v4):**

```json
{"_key": "en", "value": "hello"}
```

**After (v5):**

```json
{"_key": "abc123", "language": "en", "value": "hello"}
```

## How to upgrade

Full details in [README Migrate from v4 to v5](https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/README.md#migrate-from-v4-to-v5) section of the README.

1. Update GROQ queries from `_key == "en"` to `language == "en"  || _key == "en"` until the migration is completed.
2. Run the new bundled migration helper to update existing documents. Create a migration file in your project that imports from `sanity-plugin-internationalized-array/migrations`, configures your `documentTypes`, and exports the migration:

   ```ts
   // ./migrations/migrateToLanguageField.ts
   import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'
   export default migrateToLanguageField(['yourType'])
   ```

   ```bash
   npx sanity migration run migrateToLanguageField
   ```

   Verify everything looks as expected

   ```bash
   npx sanity migration run migrateToLanguageField  --no-dry-run
   ```

3. Update any custom code that reads `_key` as the language identifier to use the `language` field instead.
4. Remove `_key == "en"` from your queries once migration is complete, since language is now stored in `language`.

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
        {id: 'fr', title: 'French'}
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
