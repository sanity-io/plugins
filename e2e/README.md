# E2E Testing (Smoke)

Playwright smoke tests for the dedicated [e2e studio](../dev/e2e-studio). Auth follows the same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity): bots never click “Sign in”; Playwright seeds Studio’s `__studio_auth_token_<projectId>` localStorage via `storageState`.

## The e2e studio

`dev/e2e-studio` is a **bare-bones studio used only for e2e testing** — separate from `dev/test-studio` (normal development work). It has two workspaces, `/chromium` and `/firefox`, each pointed at that browser’s ephemeral dataset, with just the structure tool and one simple schema type (`smokeTestDocument`). **No monorepo plugins are installed yet**: each plugin gets added to this studio together with the e2e tests that cover it.

## Required secrets / vars

E2E runs against the Sanity sandbox org project **plugins-e2e-testing** (`a1psl692`).

| Variable / secret              | Purpose                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `SANITY_E2E_SESSION_TOKEN`     | Studio session/API token (secret; must be able to create datasets)              |
| `SANITY_E2E_PROJECT_ID`        | Project id — must match the storage key suffix (variable: `a1psl692`)           |
| `SANITY_E2E_DATASET`           | Default/fallback dataset (local). CI uses ephemeral per-browser names           |
| `SANITY_E2E_DATASET_CHROMIUM`  | Chromium workspace dataset (set automatically in CI)                            |
| `SANITY_E2E_DATASET_FIREFOX`   | Firefox workspace dataset (set automatically in CI)                             |
| `SANITY_E2E_BASE_URL`          | Studio origin (default `http://localhost:3333`; CI uses the Vercel preview URL) |
| `VERCEL_E2E_REPORT_TOKEN`      | Vercel token used for the studio preview + HTML report deploys (secret)         |
| `VERCEL_E2E_REPORT_ORG_ID`     | Vercel team/org id for that project (secret)                                    |
| `VERCEL_E2E_REPORT_PROJECT_ID` | Vercel project id used for both studio preview and report deploys (secret)      |

`SANITY_E2E_STUDIO_DATASET` is still accepted as an alias for `SANITY_E2E_DATASET`.

In CI:

- Secrets: `SANITY_E2E_SESSION_TOKEN`, `VERCEL_E2E_REPORT_*` (shared by the studio preview and report deploys)
- Variable: `SANITY_E2E_PROJECT_ID` (`a1psl692`)
- Ephemeral datasets are created per run (see below)

Copy [`e2e/.env.example`](./.env.example) to `e2e/.env.local` and fill in values, or export the vars in your shell.

Get a Sanity token via `sanity login` then `sanity debug --secrets`, or create a project API token in [manage.sanity.io](https://www.sanity.io/manage) for **plugins-e2e-testing** (`a1psl692`). The token needs permission to create/delete datasets.

**Do not use `SANITY_DEPLOY_TOKEN`.** That secret is for `sanity deploy` only and will fail auth preflight / studio login.

Ensure project `a1psl692` allows CORS origin `http://localhost:3333` (API → CORS origins in manage).

## Ephemeral datasets

Same naming and lifecycle as [`sanity-io/sanity`](https://github.com/sanity-io/sanity):

| Context        | Chromium                        | Firefox                        |
| -------------- | ------------------------------- | ------------------------------ |
| Pull request   | `pr-{number}-chromium-{run_id}` | `pr-{number}-firefox-{run_id}` |
| Push to `main` | `main-chromium-{run_id}`        | `main-firefox-{run_id}`        |

CI creates both datasets in a `setup` job while a parallel `deploy-preview` job builds the studio (`vercel build` with both dataset env vars baked in) and deploys it to Vercel. Chromium and Firefox then run as a **matrix** (parallel jobs) against the deployed preview URL — `playwright test --project <browser>` with that browser’s dataset (`SANITY_E2E_DATASET`). No local dev server runs in CI. Blob reports are merged afterward for the PR comment / Vercel HTML report.

The e2e studio exposes `/chromium` and `/firefox` workspaces pointed at those datasets (the dataset name is shown as the workspace subtitle in the navbar). Playwright projects use `baseURL` `/chromium` and `/firefox`.

Datasets are **not** deleted at the end of each run. A scheduled workflow (`.github/workflows/e2e-periodic-cleanup.yml`, every 6 hours) runs `pnpm e2e:cleanup`:

- Deletes `pr-*` datasets whose PR is closed
- Deletes `main-chromium-*` / `main-firefox-*` datasets older than 24 hours

Locally:

```bash
SANITY_E2E_DATASET=my-local-e2e pnpm e2e:setup
SANITY_E2E_DATASET_CHROMIUM=my-local-e2e \
SANITY_E2E_DATASET_FIREFOX=my-local-e2e \
pnpm test:e2e
```

## Vercel studio preview

CI deploys the studio under test to Vercel per run (same as [`sanity-io/sanity`](https://github.com/sanity-io/sanity)): `vercel pull` → `vercel build` (ephemeral dataset env vars baked in) → `vercel deploy --prebuilt`. Pushes to `main` deploy with `--prod`. Playwright targets the deployment URL via `SANITY_E2E_BASE_URL`; `playwright.config.ts` skips the local `webServer` for remote URLs.

The studio preview reuses the same Vercel project and secrets as report hosting (`VERCEL_E2E_REPORT_*`). Report deploys are `--prebuilt` static output, so they are unaffected by the project’s build settings.

### One-time setup

1. **Set the Root Directory** of the Vercel project to `dev/e2e-studio` (Project Settings → General) and enable “Include source files outside of the Root Directory”. Build command and output dir come from `dev/e2e-studio/vercel.json`.
2. **Disable Deployment Protection** on the project so Playwright (and reviewers) can open preview URLs without Vercel auth.
3. **Allow CORS** for the preview URLs on the Sanity project `a1psl692`: add `https://*.vercel.app` (or a narrower pattern for the project’s deployment domain) in manage → API → CORS origins.

## Vercel report hosting

CI deploys the Playwright HTML report to a dedicated Vercel project. PR comments link counts into the hosted report (`[🟢 N passed](…#?q=s%3Apassed)`, etc.).

### One-time setup

1. **Create a Vercel project** for static HTML reports only (suggested name: `plugins-e2e-report`).
2. **Create a Vercel token** with deploy access: [vercel.com/account/tokens](https://vercel.com/account/tokens).
3. **Find org + project ids** (Vercel dashboard → project → Settings → General, or `vercel project inspect plugins-e2e-report`).
4. **Add GitHub Actions secrets**: `VERCEL_E2E_REPORT_TOKEN`, `VERCEL_E2E_REPORT_ORG_ID`, `VERCEL_E2E_REPORT_PROJECT_ID`.
5. Re-run the **E2E** workflow.

Optional: disable Deployment Protection on that project so report links open without login.

## Running tests

From the repo root:

```bash
# Install browsers once
pnpm --filter e2e exec playwright install --with-deps chromium firefox

# Run smoke suite (starts the e2e studio via webServer if needed)
pnpm test:e2e
```

Helpers:

| Script             | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `pnpm e2e:setup`   | Create a dataset (`SANITY_E2E_DATASET`) if missing      |
| `pnpm e2e:cleanup` | Delete closed-PR / stale main datasets                  |
| `pnpm e2e:dev`     | Start the e2e studio with `sanity dev`                  |
| `pnpm e2e:build`   | Build the e2e studio                                    |
| `pnpm e2e:start`   | Preview the built studio (`sanity preview --port 3333`) |
| `pnpm test:e2e`    | Run Playwright                                          |

Locally, Playwright starts `pnpm --filter e2e-studio dev` unless a server is already on port 3333 (set `SANITY_E2E_BASE_URL` to a deployed studio to skip the local server). In CI, tests run against the per-run Vercel preview deployment.

On pull requests, CI posts an **E2E Tests** status comment with pass/fail/flaky/skipped counts, a hosted HTML report URL, dataset names, and a link to the workflow run.

## Troubleshooting auth

1. **Missing secret/vars** — Config and CI fail fast if required env/secrets are unset. See the error pointing at this README.
2. **Deploy token used by mistake** — Auth preflight calls `GET /users/me`. A 401/403 usually means the wrong token kind; use a session/API token, not `SANITY_DEPLOY_TOKEN`.
3. **Project id mismatch** — Storage key is `__studio_auth_token_${SANITY_E2E_PROJECT_ID}`. If the studio uses a different project id, auth will look signed out.
4. **CORS** — Local origin must be allowed on the Sanity project.
5. **Login screen still visible** — Token invalid or storageState origin ≠ `SANITY_E2E_BASE_URL`.
6. **Report deploy failed** — Confirm the three `VERCEL_E2E_REPORT_*` secrets match the Vercel project.
7. **Dataset create failed** — Token needs dataset create permission on `a1psl692`.
