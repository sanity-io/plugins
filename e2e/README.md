# E2E Testing (Smoke)

Playwright smoke tests for the plugins [test studio](../dev/test-studio). Auth follows the same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity): bots never click “Sign in”; Playwright seeds Studio’s `__studio_auth_token_<projectId>` localStorage via `storageState`.

## Required secrets / vars

E2E runs against the Sanity sandbox org project **plugins-e2e-testing** (`a1psl692`).

| Variable / secret              | Purpose                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `SANITY_E2E_SESSION_TOKEN`     | Studio session/API token (secret; must be able to create datasets)    |
| `SANITY_E2E_PROJECT_ID`        | Project id — must match the storage key suffix (variable: `a1psl692`) |
| `SANITY_E2E_DATASET`           | Default/fallback dataset (local). CI uses ephemeral per-browser names |
| `SANITY_E2E_DATASET_CHROMIUM`  | Chromium workspace dataset (set automatically in CI)                  |
| `SANITY_E2E_DATASET_FIREFOX`   | Firefox workspace dataset (set automatically in CI)                   |
| `SANITY_E2E_BASE_URL`          | Studio origin (default `http://localhost:3333`)                       |
| `VERCEL_E2E_REPORT_TOKEN`      | Vercel token used to deploy the HTML report (secret)                  |
| `VERCEL_E2E_REPORT_ORG_ID`     | Vercel team/org id for the report project (secret)                    |
| `VERCEL_E2E_REPORT_PROJECT_ID` | Vercel project id for the report host (secret)                        |

`SANITY_E2E_STUDIO_DATASET` is still accepted as an alias for `SANITY_E2E_DATASET`.

In CI:

- Secrets: `SANITY_E2E_SESSION_TOKEN`, `VERCEL_E2E_REPORT_*`
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

CI creates both datasets before building the studio (`pnpm e2e:setup`). The test studio exposes `/chromium` and `/firefox` workspaces (Home kitchen-sink plugins) pointed at those datasets. Playwright projects use `baseURL` `/chromium` and `/firefox`.

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

# Run smoke suite (starts test-studio via webServer if needed)
pnpm test:e2e
```

Helpers:

| Script             | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `pnpm e2e:setup`   | Create a dataset (`SANITY_E2E_DATASET`) if missing      |
| `pnpm e2e:cleanup` | Delete closed-PR / stale main datasets                  |
| `pnpm e2e:dev`     | Start test studio with `sanity dev`                     |
| `pnpm e2e:build`   | Build workspace deps + test studio                      |
| `pnpm e2e:start`   | Preview the built studio (`sanity preview --port 3333`) |
| `pnpm test:e2e`    | Run Playwright                                          |

Locally, Playwright starts `pnpm --filter test-studio dev` unless a server is already on port 3333. In CI it creates ephemeral datasets, builds the studio with those dataset env vars, then uses `sanity preview`.

On pull requests, CI posts an **E2E Tests** status comment with pass/fail/flaky/skipped counts, a hosted HTML report URL, dataset names, and a link to the workflow run.

## Troubleshooting auth

1. **Missing secret/vars** — Config and CI fail fast if required env/secrets are unset. See the error pointing at this README.
2. **Deploy token used by mistake** — Auth preflight calls `GET /users/me`. A 401/403 usually means the wrong token kind; use a session/API token, not `SANITY_DEPLOY_TOKEN`.
3. **Project id mismatch** — Storage key is `__studio_auth_token_${SANITY_E2E_PROJECT_ID}`. If the studio uses a different project id, auth will look signed out.
4. **CORS** — Local origin must be allowed on the Sanity project.
5. **Login screen still visible** — Token invalid or storageState origin ≠ `SANITY_E2E_BASE_URL`.
6. **Report deploy failed** — Confirm the three `VERCEL_E2E_REPORT_*` secrets match the Vercel project.
7. **Dataset create failed** — Token needs dataset create permission on `a1psl692`.

## Follow-ups

1. **Vercel studio preview hosting** — Deploy the studio under test and set `SANITY_E2E_BASE_URL` to the preview URL (skip local `webServer`), matching Sanity’s main e2e deploy-preview job.
