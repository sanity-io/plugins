# Reproducing issue #912 in the test-studio

Tracking: https://github.com/sanity-io/plugins/issues/912

This branch is `main` plus a studio fixture. It does not include the fix.
Translate fields still sends read-only and assist-excluded internationalized
array paths.

## What you should see

1. **Read-only field is overwritten.** On `Issue #912 reproduction`, `slug` is
   `readOnly: true` and starts as English `hello`. Translate fields from
   English to Spanish writes a Spanish slug (and can write a value that fails
   validation). `title` is the writable control and should gain Spanish.
2. **Excluded field fails the task.** On `Issue #912 exclude reproduction`,
   `sku` has `options.aiAssist.exclude: true`. Translate fields fails with
   `No schema exists for segment "sku"`.

## Run it

From the monorepo root:

```bash
pnpm install
pnpm dev
```

Sign in to the home workspace (`http://localhost:3333/home`). AI Assist must
already be enabled for the studio project.

1. Open the `Scripts` tool.
2. Open `Seed issue #912 repro` at `/home/scripts/seed-issue-912`.
3. Click `Run script`.
4. Under **Input plugins**, open `Issue #912 reproduction` (`issue-912-repro`).
5. Open the document AI Assist menu and choose **Translate fields...**.
6. From English, to Spanish, then **Translate**.
7. Repeat from step 4 with `Issue #912 exclude reproduction`
   (`issue-912-exclude-repro`).

Creating either document from the structure list also starts from the same
English values, via `initialValue`.

Cleanup: delete the two drafts `issue-912-repro` and `issue-912-exclude-repro`.
