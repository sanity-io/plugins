---
name: i18n-array-groq-query-migration
description: Detect and update legacy GROQ patterns where language is read from _key for sanity-plugin-internationalized-array when users mention v4 to v5 migration, or @sanity/document-internationalization from v5 to v6. GROQ query updates, localized arrays, or patterns like `_key == "en"` and `_key == $language`.
---

# Internationalized Array GROQ Migration

## Goal

Help users find GROQ queries that still read locale from `_key` and rewrite them safely for v5.

## When To Use

Use this skill when a user asks to:

- migrate `sanity-plugin-internationalized-array` from v4 to v5
- migrate `@sanity/document-internationalization` from v5 to v6 alongside `sanity-plugin-internationalized-array` language field changes
- find queries that still use `_key` for language lookup
- update GROQ filters like `_key == "en"` or `_key == $language`

## Detection Workflow

Detection commands below use `grep`. If your environment differs, use your editor's global search with equivalent patterns.

1. Search for direct language comparisons on `_key`:

```bash
grep -REn --exclude-dir=node_modules "_key[[:space:]]*==[[:space:]]*(\"[^\"]+\"|'[^']+'|\\$[A-Za-z_][A-Za-z0-9_]*)" .
```

1. Search for any localized-array filters that mention `_key`:

```bash
grep -REn --exclude-dir=node_modules "\[[^]]*_key[^]]*\]" .
```

1. Prioritize matches that look like localized-value reads, for example:

- `field[_key == ...][0].value`
- `select(...)` branches that compare `_key` to a language value

1. Check for uses of `groq` and verify if they use `_key` as the language, if it is using it, update them.

1. Explicitly check for template-interpolated language expressions and keep the same operand, for example:
   - `_key == "${language}"`
   - `_key == "${locale}"`

1. Review each match to avoid false positives where `_key` is used for unrelated array item identity.

## Rewrite Rules

Use the same language operand from the original query. The language operand can be a string literal (for example `"en"`), a variable (for example `$language`), or a template-interpolated expression (for example `"${language}"`).

- **Before data migration is executed (backwards compatible):**
  - `_key == <languageExpr>` -> `language == <languageExpr> || _key == <languageExpr>`
- **After migration is complete:**
  - `language == <languageExpr> || _key == <languageExpr>` -> `language == <languageExpr>`

## Examples

Legacy:

```groq
*[_type == "person"]{
  "greeting": greeting[_key == $language][0].value
}
```

Backwards compatible:

```groq
*[_type == "person"]{
  "greeting": greeting[language == $language || _key == $language][0].value
}
```

Post-migration final form:

```groq
*[_type == "person"]{
  "greeting": greeting[language == $language][0].value
}
```

## Response Template

When reporting findings to a user:

1. List each query location that still uses `_key` as language source.
2. Show the exact replacement using the same language expression.
3. Label each replacement as:
   - `backwards-compatible` (pre-migration), or
   - `final` (post-migration complete).
4. Label each match category as `runtime`, `docs/example`, or `ambiguous`.
5. Call out any ambiguous `_key` usage that needs manual review.
