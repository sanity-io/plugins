---
name: document-internationalization-language-field
overview: Update @sanity/document-internationalization to work with sanity-plugin-internationalized-array's new `language` field format, replacing all `_key`-as-language usages with the dedicated `language` field.
todos:
  - id: export-constant
    content: 'Phase 0: Export LANGUAGE_FIELD_NAME from sanity-plugin-internationalized-array'
    status: completed
  - id: update-types
    content: 'Phase 1: Update TranslationReference type to include language field'
    status: completed
  - id: update-create-reference
    content: 'Phase 1: Update createReference() to add language field and generate _key with randomKey'
    status: completed
  - id: update-plugin-validation
    content: 'Phase 1: Update plugin.tsx validation and filter to use language field'
    status: completed
  - id: update-language-lookup
    content: 'Phase 1: Update LanguageOption, DocumentInternationalizationMenu - use language for lookup'
    status: completed
  - id: update-duplicate-action
    content: 'Phase 1: Update DuplicateWithTranslationsAction - rename locale to itemKey'
    status: completed
  - id: update-delete-action
    content: 'Phase 1: Update DeleteTranslationAction - unset by language field'
    status: completed
  - id: update-metadata-preview
    content: 'Phase 1: Update metadata.ts preview to use language field'
    status: completed
  - id: update-exclude-paths
    content: 'Phase 1: Update excludePaths.ts - use language for DocumentMember name (optional)'
    status: completed
  - id: migration-translation-metadata
    content: 'Phase 2: Ensure translation.metadata is covered by migration docs'
    status: pending
  - id: readme-docs
    content: 'Phase 2: Update document-internationalization README - migration note'
    status: pending
  - id: changeset
    content: 'Phase 2: Add changeset for @sanity/document-internationalization'
    status: pending
isProject: false
---

# Document Internationalization: Migration to language Field

## Context

The `sanity-plugin-internationalized-array` plugin has migrated from using `_key` as the language identifier to a dedicated `language` field (see `i18n-array-language-field_d451ff14.plan.md`). The `@sanity/document-internationalization` plugin uses the internationalized-array plugin for its `translation.metadata` documents' `translations` array.

**Linear reference:** SAPP-3048 — Changes must go hand-in-hand with the array plugin upgrade, plus migration docs.

## Data Format Change

**Before (v4.x — current document-internationalization behavior):**

```json
{
  "translations": [
    {"_key": "en", "_type": "internationalizedArrayReferenceValue", "value": {"_ref": "..."}},
    {"_key": "fr", "_type": "internationalizedArrayReferenceValue", "value": {"_ref": "..."}}
  ]
}
```

**After (v5+ — target format):**

```json
{
  "translations": [
    {
      "_key": "abc123",
      "language": "en",
      "_type": "internationalizedArrayReferenceValue",
      "value": {"_ref": "..."}
    },
    {
      "_key": "def456",
      "language": "fr",
      "_type": "internationalizedArrayReferenceValue",
      "value": {"_ref": "..."}
    }
  ]
}
```

## Dependency

- **Package:** `plugins/@sanity/document-internationalization`
- **Depends on:** `sanity-plugin-internationalized-array` (workspace:^)
- **Integration:** Uses `internationalizedArray()` with a reference field type for the `translations` array on `translation.metadata` documents

## Files Requiring Changes

| File                                                           | Current Usage                                              | Required Change                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/utils/createReference.ts`                                 | `_key: key` (key = language id)                            | Add `uuid()` for key, add `language: key`                                        |
| `src/plugin.tsx`                                               | Validation: `item._key`; Filter: `language['_key']`        | Use `item.language` and `language['language']`                                   |
| `src/components/LanguageOption.tsx`                            | `t._key === language.id`                                   | `t.language === language.id`                                                     |
| `src/components/DocumentInternationalizationMenu.tsx`          | `t._key === language.id`                                   | `t.language === language.id`                                                     |
| `src/components/OptimisticallyStrengthen/ReferencePatcher.tsx` | `{_key: translation._key}`                                 | No change — path uses actual key (correct)                                       |
| `src/components/OptimisticallyStrengthen/index.tsx`            | `key={translation._key}`                                   | No change — React key uses key (correct)                                         |
| `src/components/BulkPublish/index.tsx`                         | `key={translation._key}`                                   | No change — React key (correct)                                                  |
| `src/actions/DuplicateWithTranslationsAction.tsx`              | `locale = translation._key`; patch `[_key == "${locale}"]` | Use `translation._key` for patch target (copy has same keys); rename for clarity |
| `src/actions/DeleteTranslationAction.tsx`                      | `unset([[_key == "${documentLanguage}"]])`                 | `unset([[language == "${documentLanguage}"]])` — match by language               |
| `src/schema/translation/metadata.ts`                           | `t._key.toUpperCase()` for preview                         | `t.language.toUpperCase()` (or `t[LANGUAGE_FIELD]`)                              |
| `src/utils/excludePaths.ts`                                    | `name: item._key` for array member                         | Optional: `name: item.language ?? item._key` for display                         |
| `src/types.ts`                                                 | `TranslationReference` extends KeyedObject                 | Add `language: string` to type                                                   |

## Implementation Plan

### Phase 0: Export LANGUAGE_FIELD_NAME (Optional but Recommended)

**File:** `plugins/sanity-plugin-internationalized-array/src/index.ts`

```typescript
export {LANGUAGE_FIELD_NAME} from './constants'
```

This allows document-internationalization to import the constant and stay in sync. Alternatively, the doc-i18n plugin can define its own constant `TRANSLATION_LANGUAGE_FIELD = 'language'` if we prefer not to add exports.

### Phase 1: Core Changes

#### 1.1 Types (`src/types.ts`)

```typescript
export type TranslationReference = KeyedObject & {
  _type: 'internationalizedArrayReferenceValue'
  /** Language identifier (e.g. 'en', 'fr'). Use this instead of _key in v5+. */
  language: string
  value: Reference
}
```

#### 1.2 createReference (`src/utils/createReference.ts`)

- Add `uuid` import from `@sanity/uuid`
- Generate `_key` with `uuid()`
- Add `language: key` (first param remains the language id for API compatibility)
- Keep `_type` and `value` unchanged

```typescript
import {uuid} from '@sanity/uuid'

export function createReference(
  languageId: string,
  ref: string,
  type: string,
  strengthenOnPublish: boolean = true,
): TranslationReference {
  return {
    _key: uuid(),
    language: languageId,
    _type: 'internationalizedArrayReferenceValue',
    value: { _type: 'reference', _ref: ref, _weak: true, ... },
  }
}
```

**Dependency:** document-internationalization already has `@sanity/uuid`.

#### 1.3 Plugin validation and filter (`src/plugin.tsx`)

- **Validation (line ~164, 177):** Change `!item?._key` → `!item?.language` (or keep key check for backward compat during migration — see note below)
- **Validation (line 177):** `valueLanguage === item._key` → `valueLanguage === item.language`
- **Filter (lines 191, 193, 200, 207):** Replace `p['_key']` / `language['_key']` with `p['language']` / `language['language']` (or use `LANGUAGE_FIELD_NAME` constant)

**Migration note:** During a transition period, existing documents may have only `_key` (no `language`). The internationalized-array plugin's MigrationBanner handles in-Studio migration. Doc-i18n could support a fallback `item.language ?? item._key` for reads only, to avoid validation errors before migration. Recommend deciding per product: strict (require migration first) vs. fallback.

#### 1.4 Language lookup (LanguageOption, DocumentInternationalizationMenu)

```typescript
// Before
metadata.translations.find((t) => t._key === language.id)

// After (with fallback for unmigrated data)
metadata.translations.find((t) => (t.language ?? t._key) === language.id)
```

Or strictly: `t.language === language.id` once migration is assumed.

#### 1.5 DuplicateWithTranslationsAction (`src/actions/DuplicateWithTranslationsAction.tsx`)

**No logic change required.** The duplicate flow copies the metadata document, so the duplicated doc has the same `_key` values on its `translations` array. The patch targets items by `_key` (array item identity), which remains correct. We iterate over the original metadata's translations, duplicate each referenced document, and patch the duplicated metadata using `translation._key` for the path. Rename `locale` → `itemKey` for clarity only.

#### 1.6 DeleteTranslationAction (`src/actions/DeleteTranslationAction.tsx`)

- **Line 34:** `[_key == "${documentLanguage}"]` → `[language == "${documentLanguage}"]`
- `documentLanguage` is the language id from the document being deleted. We must unset the array item where `language === documentLanguage`.
- **Sanity patch syntax:** Per JSONMatch, `array[language == "en"]` should work for targeting. If not, fallback: fetch the metadata doc, find the item with `item.language === documentLanguage`, get its `_key`, then `unset([`translations[_key == "${item._key}"]`])`.

#### 1.7 Metadata preview (`src/schema/translation/metadata.ts`)

```typescript
translations
  .map((t: {_key?: string; language?: string}) => (t.language ?? t._key ?? '').toUpperCase())
  .join(', ')
```

#### 1.8 excludePaths (`src/utils/excludePaths.ts`)

- **Lines 94–106:** Used for path construction and `DocumentMember.name`
- Path construction must use actual `item._key` (unchanged)
- **Optional:** For `name`, use `item.language ?? item._key` so excluded paths display the language id instead of a random key. Low priority.

### Phase 2: Migration and Docs

#### 2.1 Migration coverage for translation.metadata

The `keyToLanguageMigration.ts` in internationalized-array uses `documentTypes: ['post', 'page']` as an example. Users with document-internationalization must also include `'translation.metadata'` in their migration's document types so that `translations` arrays are migrated.

**Action:** Update the internationalized-array migration example and README to mention `translation.metadata`. Ensure the migration's `object` handler matches `internationalizedArrayReferenceValue` (it uses `internationalizedArray*Value` pattern — verify this covers the reference type).

#### 2.2 Document-internationalization README

Add a short "Upgrading from v4" / "Migrating to v5" section that:

- States the breaking change: `_key` no longer holds the language id
- Points users to the internationalized-array migration guide
- Mentions including `translation.metadata` in the migration's document types

#### 2.3 Changeset

Create a changeset for `@sanity/document-internationalization`:

```markdown
---
'@sanity/document-internationalization': minor
---

Support sanity-plugin-internationalized-array v5 language field format. Breaking: translation.metadata documents must be migrated; see migration guide.
```

Use `minor` if we add fallbacks; use `major` if we require migration first with no backward compat.

## Testing

1. **Test Studio:** The kitchen-sink workspace uses both plugins. After changes:

- Create a new translation — verify `language` is set and `_key` is a uuid
- Create, open, duplicate, and delete translations
- Verify Metadata preview shows language codes

1. **Existing data:** If migration hasn’t run, verify fallback behavior or clear error messaging.
2. **Run:** `pnpm build` and `pnpm test` for both plugins.

## Coordination

- Document-internationalization should be updated in the same release cycle as internationalized-array (or the next minor/patch that supports it).
- Release order: internationalized-array first, then document-internationalization.
- Changelog for document-internationalization should reference the internationalized-array upgrade and migration steps.
