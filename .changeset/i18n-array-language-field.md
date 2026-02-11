---
"sanity-plugin-internationalized-array": major
---

Move language identifier from `_key` to dedicated `language` field

**Breaking change**: Internationalized array items now store the language identifier in a `language` field instead of `_key`. The `_key` field is now a random unique ID.

**Before (v4):**
```json
{"_key": "en", "value": "hello"}
```

**After (v5):**
```json
{"_key": "abc123", "language": "en", "value": "hello"}
```

**What you need to do:**

1. Update GROQ queries from `_key == "en"` to `language == "en"`
2. Run the bundled migration script to update existing documents (see `migrations/keyToLanguageMigration.ts`)
