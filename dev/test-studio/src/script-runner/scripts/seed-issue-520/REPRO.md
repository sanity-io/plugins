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

There is currently no committed unit test fixture for this repro in this
branch. Use the end-to-end repro below to verify the issue in the dev
test-studio instead.

## End-to-end repro in the dev test-studio

For a live repro inside the test-studio's `kitchen-sink` workspace:

### 1. Schema

A dedicated document type `issue520Repro` is added in
`dev/test-studio/src/internationalized-array/issue-520-repro.ts` and wired
into the `kitchen-sink` workspace via the existing
`internationalizedArrayExample` plugin export.

### 2. Studio runner script

Use the Studio Script Runner entrypoint at
`dev/test-studio/src/script-runner/scripts/seed-issue-520/index.ts`. It runs
inside the `kitchen-sink` Studio workspace with the logged-in user's Studio
client and:

1. Create an asap release.
2. Add a version of the provided published document id with the internationalized array in
   deliberately misordered `_key` order (`[es, en, de, fr]` against config
   order `[en, es, fr, de, pt, it]`).
3. Publish the release immediately.

This mirrors the exact reproduction steps from the issue.

### 3. Run it

From the monorepo root:

```bash
pnpm install
pnpm --filter test-studio dev
```

Then run the Studio script:

1. Open the studio at `http://localhost:3333/kitchen-sink`.
2. Open the `Scripts` tool from the Studio tools menu.
3. Open `Seed issue #520 repro` at `/kitchen-sink/scripts/seed-issue-520`.
4. Set `Published document ID` to the document id you want to reproduce with
   (defaults to `issue-520-repro`).
5. Click `Run script`.

The script output panel prints the release id it creates and confirms when it
has published. Do not use the old `pnpm --filter test-studio seed:issue-520`
CLI script for this repro; this repro should run through the Studio so it uses
the same authenticated Studio client path as the script runner.

### 4. Observe the crash in Studio

1. Navigate to the `Issue #520 reproduction` document type and open the
   `issue-520-repro` document.
2. Make sure the perspective is the _published_ version (the Studio script
   publishes via a release, so there is no draft).
3. The "Localized text" field crashes with
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
