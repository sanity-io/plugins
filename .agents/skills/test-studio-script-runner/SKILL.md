---
name: test-studio-script-runner
description: Explains the dev/test-studio Script Runner tool. Use when adding, editing, running, or documenting scripts in dev/test-studio/src/script-runner, or when the user mentions the Scripts tool, Studio runner scripts, script variables, or browser-side Sanity Studio scripts.
---

# Test Studio Script Runner

Use this skill when working with the `Scripts` tool in `dev/test-studio`.

## Key Files

- Tool plugin: `dev/test-studio/src/script-runner/index.tsx`
- Runner UI: `dev/test-studio/src/script-runner/ScriptRunnerTool.tsx`
- Script registry: `dev/test-studio/src/script-runner/registry.ts`
- Script contract: `dev/test-studio/src/script-runner/types.ts`
- Script modules: `dev/test-studio/src/script-runner/scripts/*/index.ts`
- Agent-facing docs: `dev/test-studio/src/script-runner/README.md`

Read `README.md` and `types.ts` before changing the runner or adding scripts.

## What The Tool Does

The runner is a Sanity Studio custom tool registered in the `kitchen-sink` workspace.

- Home route: `<studio>/kitchen-sink/scripts`
- Script route: `<studio>/kitchen-sink/scripts/<script-name>`

Scripts are browser-side TypeScript modules discovered at build time with Vite `import.meta.glob`.
They run inside Sanity Studio with the logged-in user's permissions and receive the Studio client.

## Adding A Script

Add a folder under `dev/test-studio/src/script-runner/scripts/`. The folder name should match the
script name. Put the registered entrypoint in `index.ts`; any helper files can live beside it.

```text
scripts/
  my-script-name/
    index.ts
    helpers.ts
```

Only `scripts/*/index.ts` files are discovered at build time.

```ts
import type {StudioScript} from '../../types'

const script: StudioScript = {
  name: 'my-script-name',
  title: 'My script name',
  description: 'What this script does.',
  apiVersion: '2026-03-01',
  inputs: [
    {
      name: 'documentId',
      title: 'Document ID',
      defaultValue: 'example-id',
      required: true,
    },
  ],
  async run({client, inputs, log}) {
    log.info(`Running for ${inputs.documentId}`)
    await client.fetch('*[_type == "post"][0...1]')
    log.success('Done')
  },
}

export default script
```

Script names must be unique and use lowercase letters, numbers, and hyphens. Keep the folder name
and script `name` aligned. The script name becomes the URL segment.

## Runtime Contract

`run()` receives:

- `client`: Sanity Studio client, configured with the script `apiVersion` or the runner default.
- `inputs`: string values from the run screen, keyed by input `name`.
- `log`: `info`, `success`, `warning`, and `error` methods that append output in the UI.
- `signal`: an `AbortSignal` reserved for script code that supports cancellation.

## String Variables

Use `inputs` for string variables. Each input renders as a text field on the script run screen.
Required inputs disable the run button until non-empty.

Available input fields:

- `name`
- `title`
- `description`
- `defaultValue`
- `placeholder`
- `required`

All values passed to scripts are strings. Validate and trim values inside `run()` when needed.

## Browser-Safe Rules

Script runner modules execute in the browser. Do not use:

- `fs`, `path`, or other Node built-ins
- `process.exit`
- direct environment variable access
- `SANITY_AUTH_TOKEN`

Do not create a separate Sanity client from env vars. Use the provided `client`.

If a task needs Node-only APIs or token-based CLI behavior, keep it in `dev/test-studio/scripts/`
instead of the Studio script runner.

## Verification

After changing the runner or adding scripts, run:

```bash
pnpm lint
pnpm --filter test-studio build
```

If `pnpm --filter test-studio build` fails because workspace package `dist` output is missing, build
with dependencies first:

```bash
pnpm --filter test-studio... build
```
