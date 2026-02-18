---
"@sanity/document-internationalization": major
---

Support `sanity-plugin-internationalized-array` v5 `language` field format.

**Breaking change:** Translation reference items in `translation.metadata` documents now use a dedicated `language` field instead of `_key` for the language identifier. The `_key` is now a random unique ID.

**How to upgrade:**

1. Update `sanity-plugin-internationalized-array` to v5 first.
2. Backup your data.
3. Create a migration file using the new bundled helper from `sanity-plugin-internationalized-array/migrations`, and **include `'translation.metadata'` in your `documentTypes` array** so translation metadata documents are also migrated:

   ```ts
   // ./migrations/migrateToLanguageField.ts
   import {migrateToLanguageField} from 'sanity-plugin-internationalized-array/migrations'
   export default migrateToLanguageField(['yourType', 'translation.metadata'])
   ```

   ```bash
   npx sanity migration run migrateToLanguageField
   ```

   Verify everything looks as expected

   ```bash
   npx sanity migration run migrateToLanguageField   --no-dry-run
   ```

4. If you have custom code that reads `translation._key` to identify languages, update it to use `translation.language` instead.
5. If you use the legacy action exports (`DeleteTranslationAction`, `DuplicateWithTranslationsAction`), migrate to the hook-based replacements (`useDeleteTranslationAction`, `useDuplicateWithTranslationsAction`).
