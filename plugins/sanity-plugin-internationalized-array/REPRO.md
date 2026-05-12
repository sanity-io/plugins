# Reproducing issue #520 in the test-studio

Tracking: https://github.com/sanity-io/plugins/issues/520

## Summary

When an internationalized array is stored with item keys in a different order
than the master `languages` config, opening the document in a read-only
Studio perspective (e.g. the _published_ version of a doc that was created or
updated via a release) makes the field crash with
`Attempted to patch a read-only document`.

The bug is in `src/components/InternationalizedArray.tsx`: the
auto-reorder `useEffect` is guarded by `!documentReadOnly`, but in the
published/release perspective `props.readOnly` arrives as falsy. The effect
then fires `onChange(set(updatedValue))` against a read-only doc and Studio
throws.

## Unit test

A failing unit test that reproduces the read-only patch attempt without
needing a backend is committed in this same branch:

```
plugins/sanity-plugin-internationalized-array/src/components/InternationalizedArray.test.tsx
# test name: "does not crash when onChange rejects with a read-only error during auto-reorder (issue #520)"
```

Run it from the repo root:

```bash
pnpm --filter sanity-plugin-internationalized-array test InternationalizedArray
```

The test fails with `Error: Attempted to patch a read-only document` (the
exact error from the issue).

## End-to-end repro in the dev test-studio

For a live repro inside the test-studio's `kitchen-sink` workspace:

### 1. Schema

A dedicated document type `issue520Repro` is added in
`dev/test-studio/src/internationalized-array/issue-520-repro.ts` and wired
into the `kitchen-sink` workspace via the existing
`internationalizedArrayExample` plugin export.

### 2. Seed script

`dev/test-studio/scripts/seed-issue-520.mjs` uses `@sanity/client` to:

1. Create an asap release.
2. Add a version of `issue-520-repro` with the internationalized array in
   deliberately misordered `_key` order (`[es, en, de, fr]` against config
   order `[en, es, fr, de, pt, it]`).
3. Publish the release immediately.

This mirrors the exact reproduction steps from the issue.

### 3. Run it

From the monorepo root:

```bash
# Get a write+publish token from
#   https://www.sanity.io/manage/project/<your-project-id>/api#tokens
export SANITY_AUTH_TOKEN='sk...'

# Optional, defaults are 'ppsg7ml5' / 'plugins'
export SANITY_STUDIO_PROJECT_ID='ppsg7ml5'
export SANITY_STUDIO_DATASET='plugins'

pnpm install
pnpm --filter test-studio seed:issue-520
```

The script prints the release id it creates and confirms when it has
published.

### 4. Observe the crash in Studio

```bash
pnpm --filter test-studio dev
```

1. Open the studio at `http://localhost:3333/kitchen-sink`.
2. Navigate to the `Issue #520 reproduction` document type and open the
   `issue-520-repro` document.
3. Make sure the perspective is the _published_ version (the seed script
   publishes via a release, so there is no draft).
4. The "Localized text" field crashes with
   `Attempted to patch a read-only document`, matching the screenshot in
   the issue.

Cleanup (optional): delete the `issue-520-repro` document and the
`issue520-<timestamp>` releases from
`https://www.sanity.io/manage/project/<your-project-id>/datasets/<dataset>`.

## Expected fix direction

The auto-reorder `useEffect` should either:

- Use a tighter read-only check that covers the published/release perspective
  (e.g. via `useDocumentPane`'s perspective signal), or
- Wrap the `onChange(set(...))` call in a try/catch so a rejected patch
  doesn't crash the field.

Both pre- and post-fix behaviours can be verified with the unit test linked
above.
