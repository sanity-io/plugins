---
"@sanity/document-internationalization": major
---

Support `sanity-plugin-internationalized-array` v5 `language` field format.

**Breaking change:** Translation reference items in `translation.metadata` documents now use a dedicated `language` field instead of `_key` for the language identifier. The `_key` is now a random unique ID.

**How to upgrade:**

1. Update `sanity-plugin-internationalized-array` to v5 first.
2. Backup your data.
3. Run the internationalized-array migration and **include `'translation.metadata'` in your `documentTypes` array** so that translation metadata documents are also migrated:
   ```bash
   npx sanity migration run keyToLanguageMigration --dry-run
   npx sanity migration run keyToLanguageMigration
   ```
4. If you have custom code that reads `translation._key` to identify languages, update it to use `translation.language` instead.
5. If you use the legacy action exports (`DeleteTranslationAction`, `DuplicateWithTranslationsAction`), migrate to the hook-based replacements (`useDeleteTranslationAction`, `useDuplicateWithTranslationsAction`).
