# Test Studio Script Runner

The script runner adds a `Scripts` tool to the `home` test studio workspace. It lists
browser-side scripts and lets agents run them with the current Studio client.

## Routes

- `<studio>/home/scripts` shows all registered scripts.
- `<studio>/home/scripts/<script-name>` opens a script run screen.

The route segment comes from the script's `name`.

## Adding a Script

Add a folder in `dev/test-studio/src/script-runner/scripts/`. The folder name should match the
script name. Each folder must have an `index.ts` file that default exports a `StudioScript` object:

```text
scripts/
  my-script-name/
    index.ts
    helpers.ts
```

Only `scripts/*/index.ts` files are discovered at build time with Vite `import.meta.glob`, so helper
files can live beside the entrypoint without becoming standalone scripts.

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
      description: 'The document id to use when running this script.',
      defaultValue: 'example-id',
      required: true,
    },
  ],
  async run({client, inputs, log}) {
    log.info(`Starting with ${inputs.documentId}...`)

    const docs = await client.fetch('*[_type == "post"][0...10]')

    log.success(`Loaded ${docs.length} documents.`)
  },
}

export default script
```

Script names must be unique and use lowercase letters, numbers, and hyphens. Keep the folder name
and script `name` aligned. The tool sorts scripts by title on the home screen.

## Runtime Contract

Scripts run in the browser inside Sanity Studio. The `run` function receives:

- `client`: the current Studio client, configured with the script `apiVersion` or the runner default.
- `inputs`: string values collected from the run screen, keyed by input `name`.
- `log`: logger methods (`info`, `success`, `warning`, `error`) that append output to the run screen.
- `signal`: an `AbortSignal` reserved for script code that supports cancellation.

Scripts run with the logged-in Studio user's permissions. Do not read `SANITY_AUTH_TOKEN` or create a
new client from environment variables.

## String Variables

Scripts can define optional string variables with the `inputs` array. Each input renders as a text
field on the script run screen.

```ts
inputs: [
  {
    name: 'publishedId',
    title: 'Published document ID',
    description: 'The published document id to target.',
    defaultValue: 'issue-520-repro',
    placeholder: 'issue-520-repro',
    required: true,
  },
]
```

Required inputs disable the run button until they have a non-empty value. All input values are
passed to `run()` as strings.

## Browser-Safe Scripts Only

Do not use Node-only APIs in script-runner modules:

- No `fs`, `path`, or other Node built-ins.
- No `process.exit`.
- No direct environment variable access.

If a script needs CLI-only behavior, keep it in `dev/test-studio/scripts/` instead. The Studio script
runner is for scripts that can run through the authenticated Studio client.
