---
name: i18n-array-language-field
overview: Refactor the internationalized-array plugin to use a dedicated `language` field instead of `_key` for language identification, and provide an exportable migration function using Sanity's official migration tooling.
todos:
  - id: identify-key-usage
    content: 'Phase 0: Identify all places where _key is used for language identification'
    status: completed
  - id: add-constant
    content: 'Phase 0: Add LANGUAGE_FIELD_NAME constant to src/constants.ts'
    status: completed
  - id: replace-with-constant
    content: 'Phase 0: Replace all _key language references with LANGUAGE_FIELD_NAME constant (10 files, ~25 locations)'
    status: completed
  - id: flip-constant
    content: "Phase 1: Change LANGUAGE_FIELD_NAME from '_key' to 'language'"
    status: completed
  - id: types
    content: 'Phase 1: Update type definitions - Add language field to Value, InternationalizedValue, DocumentsToTranslate'
    status: completed
  - id: schema-object
    content: 'Phase 1: Update src/schema/object.ts - Add hidden language field'
    status: completed
  - id: schema-array
    content: 'Phase 1: Update src/schema/array.ts - Add validation for missing language with migration prompt'
    status: completed
  - id: key-generation
    content: 'Phase 1: Add nanoid _key generation to createAddLanguagePatches.ts and DocumentAddButtons.tsx'
    status: completed
  - id: test-utils
    content: 'Phase 1: Update test-utils.ts - createValue() must generate both _key and language'
    status: cancelled
  - id: docs-translate
    content: 'Phase 1: Update getDocumentsToTranslate.ts interface - Add language field'
    status: completed
  - id: migration
    content: 'Phase 2: Create migrations/createKeyToLanguageMigration.ts using defineMigration'
    status: pending
  - id: exports
    content: 'Phase 2: Update src/index.ts - Export migration function'
    status: pending
  - id: package-json
    content: 'Phase 1: Update package.json - Add nanoid dependency'
    status: completed
  - id: migration-banner
    content: 'Phase 1: Create MigrationBanner component for in-Studio data migration'
    status: completed
  - id: readme
    content: 'Phase 3: Update README.md - Document new format, migration guide, query changes'
    status: pending
isProject: false
---

# Pivot from \_key to language Field

## Background

The current implementation stores language IDs in the array item's `_key` field. This causes issues with:

- Array reordering and diffing in the Studio (Sanity uses `_key` to track item identity)
- Portable Text operations that rely on stable keys
- Copy/paste operations between documents where keys could collide

The solution is to move the language identifier to a dedicated `language` field, allowing `_key` to serve its intended purpose as a stable, random identifier.

## Data Format Change

**Before (current v4.x):**

```json
{
  "greeting": [
    {"_key": "en", "value": "hello"},
    {"_key": "fr", "value": "bonjour"}
  ]
}
```

**After (new format):**

```json
{
  "greeting": [
    {"_key": "abc123", "language": "en", "value": "hello"},
    {"_key": "def456", "language": "fr", "value": "bonjour"}
  ]
}
```

Using `language` as the field name is clear and semantic. This aligns with the approach in PR 112.

## PR 112 Analysis

The [original PR](https://github.com/sanity-io/sanity-plugin-internationalized-array/pull/112) had the right approach but needs adaptation:

1. **Migration approach**: Used a standalone script with `getCliClient` instead of Sanity's official `defineMigration`
2. **Not exported**: Migration wasn't exported from the package for easy user consumption
3. **Repo context**: Was for standalone repo, needs adaptation to monorepo

## Implementation Plan

### Phase 0: Introduce LANGUAGE_FIELD_NAME Constant (Preparation) ✅ COMPLETED

Before changing from `_key` to `language`, we first introduce a constant so the actual switch becomes a one-line change.

**Constant added to [src/constants.ts](plugins/sanity-plugin-internationalized-array/src/constants.ts):**

```typescript
export const LANGUAGE_FIELD_NAME = '_key' as const
```

#### Files Migrated to Use LANGUAGE_FIELD_NAME (10 files, ~25 locations)

| File                             | Locations                   | What Changed                         |
| -------------------------------- | --------------------------- | ------------------------------------ |
| `AddButtons.tsx`                 | Line 37                     | Button disabled check                |
| `DocumentAddButtons.tsx`         | Lines 92, 136               | Translation check, item creation     |
| `InternationalizedArray.tsx`     | Lines 136, 161, 168, 179    | Reordering, validation, filtering    |
| `InternationalizedInput.tsx`     | Lines 131-181 (8 locations) | Language lookup, patch path, display |
| `InternationalizedField.tsx`     | Special refactor            | See below                            |
| `fieldActions/index.ts`          | Line 32                     | Disabled state check                 |
| `schema/array.ts`                | Lines 55, 99, 112-116       | Validation checks                    |
| `schema/object.ts`               | Line 32                     | Preview subtitle                     |
| `checkAllLanguagesArePresent.ts` | Line 8                      | Language ID extraction               |
| `createAddLanguagePatches.ts`    | Lines 30-55 (6 locations)   | Item creation, matching              |

#### Special Case: InternationalizedField.tsx

This file required a more complex refactor. The original code read `_key` from the path segment, which wouldn't work after migration (path segments always use actual `_key` format):

```typescript
// Before - assumed pathSegment._key was the language
const languageId = pathSegment._key

// After - looks up actual item and reads its language field
const parentArray = useFormValue(props.path.slice(0, -2))
const itemKey = pathSegment._key // Still use _key to find item
const arrayItem = parentArray?.find((item) => item._key === itemKey)
const languageId = arrayItem?.[LANGUAGE_FIELD_NAME] // Read language from item
```

#### Usages NOT Migrated (Kept as `_key`)

These `_key` usages refer to the **actual Sanity array item key**, not the language identifier:

| Location                                                         | Reason                                        |
| ---------------------------------------------------------------- | --------------------------------------------- |
| `src/types.ts` - `Value._key`                                    | Type definition for actual `_key` field       |
| `src/utils/getDocumentsToTranslate.ts` - interface `_key`        | Interface describes actual `_key`             |
| `src/components/InternationalizedInput.tsx` - type `_key`        | Type definition                               |
| `src/components/InternationalizedField.tsx` - `pathSegment._key` | Sanity path format (fixed)                    |
| `src/schema/array.ts` - validation paths `[{_key: item._key}]`   | Sanity requires actual `_key` for error paths |

Full details: [docs/LANGUAGE_FIELD_NAME_MIGRATION.md](plugins/sanity-plugin-internationalized-array/docs/LANGUAGE_FIELD_NAME_MIGRATION.md)

### Phase 1: Flip the Constant and Add Required Changes

Once all language-related `_key` usages are replaced with `LANGUAGE_FIELD_NAME`:

**1. Change the constant value:**

```typescript
export const LANGUAGE_FIELD_NAME = 'language' as const
```

This single change propagates to all files that use the constant.

**2. Type definitions need `language` field ADDED (not just constant flip):**

The constant handles runtime code, but TypeScript types need explicit updates:

```typescript
// src/types.ts - Value type
export type Value = {
  _key: string // Random unique ID (still required by Sanity)
  language: string // NEW: Language identifier
  value?: unknown
}

// src/components/InternationalizedInput.tsx - InternationalizedValue type
export type InternationalizedValue = {
  _type: string
  _key: string // Random unique ID
  language: string // NEW: Language identifier
  value: string
}

// src/utils/getDocumentsToTranslate.ts - DocumentsToTranslate interface
export interface DocumentsToTranslate {
  _key: string // Random unique ID
  language: string // NEW: Language identifier
  // ...
}
```

**3. Item creation functions need `_key` generation ADDED:**

Functions that create items currently only set `{[LANGUAGE_FIELD_NAME]: id}`. After flip, they need BOTH fields:

```typescript
// createAddLanguagePatches.ts - Before flip creates {language: id}, missing _key
// After flip must create:
{
  _key: nanoid(),              // Random unique key
  [LANGUAGE_FIELD_NAME]: id    // Language identifier (now 'language')
}
```

Same for `DocumentAddButtons.tsx`.

**4. Test utilities need both fields:**

```typescript
// src/__tests__/test-utils.ts
export function createValue(languageId: string, value?: unknown): Value {
  return {
    _key: `test-${languageId}`, // Predictable test key
    language: languageId, // Language in dedicated field
    value,
  }
}
```

**5. Schema object needs hidden `language` field:**

Add to `src/schema/object.ts`:

```typescript
defineField({
  name: 'language',
  type: 'string',
  hidden: true, // Hidden from UI, managed internally
})
```

### Phase 2: Core Type and Schema Changes (Part of Phase 1 Implementation)

**[src/types.ts](plugins/sanity-plugin-internationalized-array/src/types.ts)**

```typescript
export type Value = {
  _key: string
  /** Language identifier (e.g., 'en', 'fr'). Added in v5. */
  language: string
  value?: unknown
}
```

**[src/schema/object.ts](plugins/sanity-plugin-internationalized-array/src/schema/object.ts)**

- Add hidden `language` field to the object schema
- Preview subtitle already uses `LANGUAGE_FIELD_NAME` (migrated in Phase 0) ✅

**[src/schema/array.ts](plugins/sanity-plugin-internationalized-array/src/schema/array.ts)**

- Validation already uses `LANGUAGE_FIELD_NAME` (migrated in Phase 0) ✅
- Add validation for missing/empty `language` values with migration prompt: "Language is required for each array item. Run the migration to update your data."

### Phase 3: Component Updates

These changes were completed in Phase 0 (constant replacement). After flipping the constant in Phase 1, they automatically use `language`:

**Already migrated to use LANGUAGE_FIELD_NAME:** ✅

- `InternationalizedInput.tsx` - 8 locations
- `InternationalizedArray.tsx` - 4 locations
- `InternationalizedField.tsx` - special refactor using useFormValue
- `AddButtons.tsx` - 1 location
- `DocumentAddButtons.tsx` - 2 locations (constant usage)

**Still needed in Phase 1:**

- `DocumentAddButtons.tsx` - Add `nanoid` for generating random `_key`
- `createAddLanguagePatches.ts` - Add `nanoid` for generating random `_key`

### Phase 4: Utility Updates

**Already migrated to use LANGUAGE_FIELD_NAME:** ✅

- `createAddLanguagePatches.ts` - 6 locations
- `checkAllLanguagesArePresent.ts` - 1 location
- `fieldActions/index.ts` - 1 location

**Still needed in Phase 1:**

- `getDocumentsToTranslate.ts` - Add `language: string` to interface (explicit field name, not constant)

### Phase 5: Test Updates

Test files use `_key` directly rather than `LANGUAGE_FIELD_NAME` because they document current behavior and need intentional updates to verify the new behavior.

**Test files to update in Phase 1:**

| File                          | Changes Needed                                         |
| ----------------------------- | ------------------------------------------------------ |
| `src/__tests__/test-utils.ts` | `createValue()` must create both `_key` and `language` |
| `*.test.ts` files (11 files)  | Update test expectations for new data shape            |

**Test utilities transformation:**

```typescript
// Before (current)
export function createValue(languageId: string, value?: unknown): Value {
  return {_key: languageId, value}
}

// After (Phase 1)
export function createValue(languageId: string, value?: unknown): Value {
  return {
    _key: `test-${languageId}`, // Predictable for test assertions
    language: languageId,
    value,
  }
}
```

### Phase 6: Migration Function (Phase 2 in todos)

Create **[src/migrations/createKeyToLanguageMigration.ts](plugins/sanity-plugin-internationalized-array/src/migrations/createKeyToLanguageMigration.ts)**:

```typescript
import {defineMigration, at, set} from 'sanity/migrate'
import {nanoid} from 'nanoid'

export type MigrationConfig = {
  documentTypes: string[]
  fieldNames: string[]
}

export function createKeyToLanguageMigration(config: MigrationConfig) {
  return defineMigration({
    title: 'Migrate internationalized array from _key to language',
    documentTypes: config.documentTypes,
    migrate: {
      document(doc, context) {
        // For each configured field, transform array items
        // Copy _key to language, generate new random _key
      },
    },
  })
}
```

**Export from [src/index.ts](plugins/sanity-plugin-internationalized-array/src/index.ts):**

```typescript
export {createKeyToLanguageMigration} from './migrations/createKeyToLanguageMigration'
```

### Phase 7: Dependencies (Part of Phase 1)

**[package.json](plugins/sanity-plugin-internationalized-array/package.json)**:

- Add `nanoid` to dependencies (already ESM-native, matches monorepo patterns)

### Phase 8: Documentation (Phase 3 in todos)

**[README.md](plugins/sanity-plugin-internationalized-array/README.md)**:

- Update "Shape of stored data" section
- Update "Querying data" with `language == "en"` examples
- Add "Migrate from v4 to v5" section with:
  - Explanation of the change
  - Migration instructions using the exported function
  - GROQ query migration guide
- Update `@sanity/language-filter` example for new data shape

## User Migration Path

Users will create a migration file in their project:

```typescript
// migrations/i18n-array-to-language-field.ts
import {createKeyToLanguageMigration} from 'sanity-plugin-internationalized-array'

export default createKeyToLanguageMigration({
  documentTypes: ['post', 'page'],
  fieldNames: ['title', 'description'],
})
```

Then run:

```bash
npx sanity migration run i18n-array-to-language-field --dry-run
npx sanity migration run i18n-array-to-language-field
```

## Breaking Changes

1. **Data format**: Existing documents need migration
2. **GROQ queries**: Must change `_key == "lang"` to `language == "lang"`
3. **Custom code**: Any code relying on `_key` being the language ID needs updating

## No Backward Compatibility - Migration Required

This is a breaking change with **no backward compatibility**. Documents with the old format (language in `_key`) will show validation errors until migrated.

**Validation behavior for unmigrated data:**

- Array items missing the `language` field will show a validation error: "Language is required for each array item. Run the migration to update your data."
- This forces users to migrate their data before continuing to use the plugin

**Why no backward compatibility:**

- Cleaner codebase without fallback logic
- Forces a clean migration rather than silently supporting two formats indefinitely
- Prevents confusion about which format is being used

## In-Studio Migration Banner

In addition to the CLI migration function, a `MigrationBanner` component was created to allow users to migrate data directly within the Sanity Studio UI.

**Files created:**

- `src/components/MigrationBanner.tsx` - The banner component
- `src/components/MigrationBanner.test.tsx` - Comprehensive test suite (17 tests)
- `src/test/setup.ts` - Vitest setup with jsdom mocks for `@sanity/ui`

**How it works:**

1. The banner automatically detects items in the old format (where `_key` matches a valid language ID and no `language` field exists)
2. Displays a caution-toned card with:

- Warning icon and "Data format update required" title
- Count of items needing migration (e.g., "3 items need to be updated to the new format.")
- "Update Languages" button (disabled when field is read-only)

3. On click, migrates all old-format items:

- Copies the old `_key` value to the new `language` field
- Generates a new random `_key` using `nanoid()`
- Preserves all other fields (`_type`, `value`, etc.)
- Shows a success toast with the count of migrated items

**Usage:**

The banner is integrated into the `InternationalizedArray` component and renders automatically when old-format data is detected. No user configuration required.

---

## Phase 0 Completion Summary

Phase 0 is complete. The `LANGUAGE_FIELD_NAME` constant has been introduced and all language-related `_key` usages (10 files, ~25 locations) have been migrated to use it.

**Key artifacts:**

- PR #548: Phase 0 implementation
- Changeset: `.changeset/i18n-array-language-constant.md`
- Documentation: `docs/LANGUAGE_FIELD_NAME_MIGRATION.md`

**Ready for Phase 1:**
Flipping the constant from `'_key'` to `'language'` will propagate to all migrated locations. Additional work needed:

1. Add `language` to type definitions
2. Add `nanoid` dependency and `_key` generation
3. Add hidden `language` field to schema
4. Update test utilities
5. Add validation for missing `language` with migration prompt

---

## Phase 1 Completion Summary ✅ COMPLETED

Phase 1 is complete. All core changes have been implemented:

**Completed tasks:**

| Task                                                                   | Status |
| ---------------------------------------------------------------------- | ------ |
| Flip `LANGUAGE_FIELD_NAME` to `'language'`                             | ✅     |
| Add `language` field to `Value` type                                   | ✅     |
| Add `language` field to `DocumentsToTranslate` interface               | ✅     |
| Add hidden `language` field to schema object                           | ✅     |
| Add validation for missing `language` with migration prompt            | ✅     |
| Add `nanoid` dependency                                                | ✅     |
| Add `_key` generation with `nanoid()` in `createAddLanguagePatches.ts` | ✅     |
| Add `_key` generation with `nanoid()` in `DocumentAddButtons.tsx`      | ✅     |
| Create `MigrationBanner` component for in-Studio migration             | ✅     |
| Create `MigrationBanner.test.tsx` test suite (17 tests)                | ✅     |

**Cancelled tasks:**

| Task                   | Reason                                                     |
| ---------------------- | ---------------------------------------------------------- |
| Update `test-utils.ts` | File doesn't exist in codebase; tests create values inline |

**Ready for Phase 2:**
Create the CLI migration function using `defineMigration` and export it from the package.
