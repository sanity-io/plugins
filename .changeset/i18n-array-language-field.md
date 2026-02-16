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

**How to upgrade:**

Full details in [README Migrate from v4 to v5](https://github.com/sanity-io/plugins/blob/main/plugins/sanity-plugin-internationalized-array/README.md#migrate-from-v4-to-v5) section of the README.

1. Update GROQ queries from `_key == "en"` to `language == "en"  || _key == "en"` until the migration is completed.
2. Run the bundled migration to update existing documents. Copy `migrations/keyToLanguageMigration.ts` to your project's `migrations/` folder, configure the `documentTypes` and `fieldNames` arrays for your schema, then run:
   ```bash
   npx sanity migration run keyToLanguageMigration --dry-run
   npx sanity migration run keyToLanguageMigration
   ```
3. Update any custom code that reads `_key` as the language identifier to use the `language` field instead.
4. Remove `_key == "en"` from your queries, now the language will be store in `language` 

