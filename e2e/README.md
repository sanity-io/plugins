# E2E Testing (Smoke)

Playwright smoke tests for the plugins [test studio](../dev/test-studio). Auth follows the same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity): bots never click “Sign in”; Playwright seeds Studio’s `__studio_auth_token_<projectId>` localStorage via `storageState`.

## Required secrets / vars

E2E runs against the Sanity sandbox org project **plugins-e2e-testing** (`a1psl692`). Set `SANITY_E2E_PROJECT_ID=a1psl692` (and a dataset on that project).

| Variable / secret              | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `SANITY_E2E_SESSION_TOKEN`     | Studio session/API token used for browser auth (secret)   |
| `SANITY_E2E_PROJECT_ID`        | Project id — must match the storage key suffix (variable) |
| `SANITY_E2E_STUDIO_DATASET`    | Dataset for the studio under test (variable)              |
| `SANITY_E2E_BASE_URL`          | Studio origin (default `http://localhost:3333`)           |
| `VERCEL_E2E_REPORT_TOKEN`      | Vercel token used to deploy the HTML report (secret)      |
| `VERCEL_E2E_REPORT_ORG_ID`     | Vercel team/org id for the report project (secret)        |
| `VERCEL_E2E_REPORT_PROJECT_ID` | Vercel project id for the report host (secret)            |

In CI these come from GitHub Actions:

- Secrets: `SANITY_E2E_SESSION_TOKEN`, `VERCEL_E2E_REPORT_TOKEN`, `VERCEL_E2E_REPORT_ORG_ID`, `VERCEL_E2E_REPORT_PROJECT_ID`
- Repository variables: `SANITY_E2E_PROJECT_ID` (use `a1psl692`), `SANITY_E2E_STUDIO_DATASET`

Copy [`e2e/.env.example`](./.env.example) to `e2e/.env.local` and fill in values, or export the vars in your shell.

The Playwright `webServer` maps `SANITY_E2E_PROJECT_ID` / `SANITY_E2E_STUDIO_DATASET` onto `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` so the test studio process uses the same project and dataset.

Get a Sanity token via `sanity login` then `sanity debug --secrets`, or create a project API token in [manage.sanity.io](https://www.sanity.io/manage) for **plugins-e2e-testing** (`a1psl692`).

**Do not use `SANITY_DEPLOY_TOKEN`.** That secret is for `sanity deploy` only and will fail auth preflight / studio login.

Ensure project `a1psl692` allows CORS origin `http://localhost:3333` (API → CORS origins in manage).

## Vercel report hosting

CI deploys the Playwright HTML report to a dedicated Vercel project (same approach as [`sanity-io/sanity`](https://github.com/sanity-io/sanity)). PR comments then link counts into the hosted report (`[🟢 N passed](…#?q=s%3Apassed)`, etc.).

### One-time setup

1. **Create a Vercel project** for static HTML reports only (no framework / empty project is fine). Suggested name: `plugins-e2e-report`.
2. **Create a Vercel token** with deploy access to that project: [vercel.com/account/tokens](https://vercel.com/account/tokens).
3. **Find org + project ids** (from a machine with Vercel CLI logged in):

   ```bash
   # Link once in an empty temp dir, or inspect an existing project
   vercel project ls
   vercel project inspect plugins-e2e-report
   ```

   Or open the project in the Vercel dashboard → **Settings** → **General**:
   - **Project ID** → `VERCEL_E2E_REPORT_PROJECT_ID`
   - **Team ID** / org id → `VERCEL_E2E_REPORT_ORG_ID`

4. **Add GitHub Actions secrets** on `sanity-io/plugins`:

   | Secret                         | Value                    |
   | ------------------------------ | ------------------------ |
   | `VERCEL_E2E_REPORT_TOKEN`      | Vercel token from step 2 |
   | `VERCEL_E2E_REPORT_ORG_ID`     | Team/org id from step 3  |
   | `VERCEL_E2E_REPORT_PROJECT_ID` | Project id from step 3   |

5. Re-run the **E2E** workflow. The PR comment should show linked pass/fail counts and **view full report**.

Optional: under the Vercel project, disable deployment protection / password for preview URLs so report links open without login.

## Running tests

From the repo root:

```bash
# Install browsers once
pnpm --filter e2e exec playwright install --with-deps chromium firefox

# Run smoke suite (starts test-studio via webServer if needed)
pnpm test:e2e
```

Helpers:

| Script           | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `pnpm e2e:dev`   | Start test studio with `sanity dev`                     |
| `pnpm e2e:build` | Build workspace deps + test studio                      |
| `pnpm e2e:start` | Preview the built studio (`sanity preview --port 3333`) |
| `pnpm test:e2e`  | Run Playwright                                          |

Locally, Playwright starts `pnpm --filter test-studio dev` unless a server is already on port 3333. In CI it uses `sanity preview` after a prior build.

On pull requests, CI posts (and updates) an **E2E Tests** status comment with pass/fail/flaky/skipped counts, a hosted HTML report URL, and a link to the workflow run — same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity).

## Troubleshooting auth

1. **Missing secret/vars** — Config and CI fail fast if `SANITY_E2E_SESSION_TOKEN`, `SANITY_E2E_PROJECT_ID`, `SANITY_E2E_STUDIO_DATASET`, or the Vercel report secrets are unset/empty/placeholder. See the error pointing at this README.
2. **Deploy token used by mistake** — Auth preflight calls `GET /users/me`. A 401/403 usually means the wrong token kind; use a session/API token, not `SANITY_DEPLOY_TOKEN`.
3. **Project id mismatch** — Storage key is `__studio_auth_token_${SANITY_E2E_PROJECT_ID}`. If the studio uses a different project id, auth will look signed out.
4. **CORS** — Local origin must be allowed on the Sanity project.
5. **Login screen still visible** — Token invalid or storageState origin ≠ `SANITY_E2E_BASE_URL`.
6. **Report deploy failed** — Confirm the three `VERCEL_E2E_REPORT_*` secrets match the Vercel project and that the token can create deployments.

## Follow-ups

Before the suite grows beyond read-only smoke (especially write-heavy tests or parallel PR CI), add:

1. **Ephemeral per-PR datasets** — Create/cleanup datasets like `pr-<n>-chromium-<run_id>` so concurrent jobs do not race on a shared dataset.
2. **Vercel studio preview hosting** — Deploy the studio under test and set `SANITY_E2E_BASE_URL` to the preview URL (skip local `webServer`).

Without those, concurrent CI and mutating tests will flake or fail against the shared dataset / local preview.
