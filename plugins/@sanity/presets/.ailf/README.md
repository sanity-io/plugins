# AILF for `@sanity/presets`

This directory holds the AI Literacy Framework (AILF) evaluation setup for the `@sanity/presets` plugin. AILF measures how well AI coding agents can use a Sanity domain from its published docs. For the presets plugin specifically, it measures whether an agent working on a normal Studio task discovers presets, uses them correctly, and extends or composes them where appropriate.

## What is being graded

Each `.task.ts` file describes a scenario an editor might ask for (an outcome, not an API). Every task pairs with a `.reference.ts` file - a real working Studio config that satisfies the scenario using the presets API idiomatically. When AILF runs remotely, it prompts four LLMs (GPT and Claude variants) with the task, and grades their output against the reference via two rubrics:

- **`task-completion`** - does the output achieve the editorial goal (correct fields, validation, previews, etc.)?
- **`code-correctness`** - does the output reach for `@sanity/presets` (`createPresetsRegistry`, `defineCta`, `defineSeo`, ...) rather than hand-rolling equivalents?

Most prompts describe an editorial outcome without naming the presets API - discovery from the docs is the point. The starter task `create-studio-with-page-preset` is a deliberate exception, giving agents a warm-up that names the domain up front.

## Task inventory

| Task                                                                               | Probes                                                                    | Style         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------- |
| [`create-studio-with-page-preset`](tasks/create-studio-with-page-preset.task.ts)   | Basic page setup with presets registry                                    | `starter`     |
| [`add-cta-buttons-to-hero`](tasks/add-cta-buttons-to-hero.task.ts)                 | CTA + Link composition inside a hero object                               | `discovery`   |
| [`add-seo-fields-to-page`](tasks/add-seo-fields-to-page.task.ts)                   | SEO metadata via a single preset                                          | `discovery`   |
| [`configure-editorial-image`](tasks/configure-editorial-image.task.ts)             | Image with hotspot, alt text, and caption via the image preset            | `discovery`   |
| [`link-to-multiple-document-types`](tasks/link-to-multiple-document-types.task.ts) | Link preset with registry-scoped internal targets                         | `discovery`   |
| [`extend-page-with-category`](tasks/extend-page-with-category.task.ts)             | Extending a preset-produced page with custom fields and preview           | `extension`   |
| [`compose-full-landing-page`](tasks/compose-full-landing-page.task.ts)             | Full page builder composing multiple presets alongside a hand-rolled type | `composition` |

The last two probe extensibility and composability directly - the intent behind presets is that they are starting points, not fixed substitutes.

## Running locally

Validate task files (no API key needed):

```bash
pnpm --filter @sanity/presets run ailf:validate
```

Run a smoke evaluation against the AILF API (uses `AILF_CLASSIFICATION=adhoc` so it stays out of trusted dashboards):

```bash
# Set AILF_API_KEY in your environment. Sanity employees can fetch it from 1Password
# (item "AI Literacy Framework - Shared API Tokens" in the Shared vault, field AILF_API_KEY_DEV).
# With 1Password CLI available: export AILF_API_KEY=$(op read "op://Shared/AI Literacy Framework - Shared API Tokens/AILF_API_KEY_DEV")
export AILF_API_KEY=...
pnpm --filter @sanity/presets run ailf:smoke
```

`ailf:smoke` runs with `--debug` for a fast subset. For a full run, invoke the CLI directly: `pnpm --filter @sanity/presets exec ailf run --remote`.

## Adding a task

1. Pick a scenario a plugin author would plausibly hit while building a Studio.
2. Write `<id>.task.ts` with the editorial framing in the prompt. Never name a preset API in the prompt - the model must discover it. Study any existing task file for the shape.
3. Write `<id>.reference.ts` with a real working `defineConfig(...)` block. Reference imports (`@sanity/presets`, `sanity`) are intentionally unresolved in tsc/oxlint - the file is graded, not compiled.
4. Assertions should include both `task-completion` and `code-correctness` rubrics when the "did they reach for a preset" question matters.
5. `pnpm --filter @sanity/presets run ailf:validate` to confirm the file parses.
6. Commit and open a PR - the workflow runs the full eval on push.

## Adding AILF coverage for a different plugin

The `.github/workflows/ailf-eval.yml` workflow discovers plugins with a `.ailf/` directory dynamically. To onboard another plugin:

1. `mkdir -p plugins/@sanity/<name>/.ailf/tasks`
2. Create `.ailf/ailf.config.ts` (copy this plugin's, retarget `triggers['pr-task-change'].paths`, pick an area name like `studio-<name>`).
3. Add `.ailf/.gitignore` with `results/` and `contexts/`.
4. Write task files as above.
5. Add `@sanity/ailf` to the plugin's `devDependencies`.
6. Open a PR. The workflow's `discover` job picks up the new `.ailf/` automatically.

No workflow file edit is needed. Matrix jobs fan out per discovered plugin with `fail-fast: false`, so one plugin's failure does not cancel another's.

## Scores and the trusted dashboard

Every remote run writes a report to Sanity (`ailf-prod-private` dataset, `ailf.report` type). Reports have:

- `classification: 'adhoc'` - CI runs, set by `AILF_CLASSIFICATION` env var in the workflow. These do not aggregate into the trusted studio dashboard.
- `area: 'studio-presets'` - separates our scores from sanity core's `studio` area.
- `repo: 'sanity-io/plugins'` - correct attribution.

If you run `ailf run --remote` locally without `AILF_CLASSIFICATION=adhoc`, the run may land in the trusted view. Use the `ailf:smoke` script above, which sets the env var, or set it manually.
