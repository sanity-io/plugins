# E2E Testing (Smoke)

Playwright smoke tests for the plugins [test studio](../dev/test-studio). Auth follows the same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity): bots never click “Sign in”; Playwright seeds Studio’s `__studio_auth_token_<projectId>` localStorage via `storageState`.

## Required secrets / vars

E2E runs against the Sanity sandbox org project **plugins-e2e-testing** (`a1psl692`). Set `SANITY_E2E_PROJECT_ID=a1psl692` (and a dataset on that project).

| Variable                    | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `SANITY_E2E_SESSION_TOKEN`  | Studio session/API token used for browser auth (required) |
| `SANITY_E2E_PROJECT_ID`     | Project id — must match the storage key suffix (required) |
| `SANITY_E2E_STUDIO_DATASET` | Dataset for the studio under test (required)              |
| `SANITY_E2E_BASE_URL`       | Studio origin (default `http://localhost:3333`)           |

In CI these come from GitHub Actions:

- Secret: `SANITY_E2E_SESSION_TOKEN`
- Repository variables: `SANITY_E2E_PROJECT_ID` (use `a1psl692`), `SANITY_E2E_STUDIO_DATASET`

Copy [`e2e/.env.example`](./.env.example) to `e2e/.env.local` and fill in values, or export the vars in your shell.

The Playwright `webServer` maps `SANITY_E2E_PROJECT_ID` / `SANITY_E2E_STUDIO_DATASET` onto `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` so the test studio process uses the same project and dataset.

Get a token via `sanity login` then `sanity debug --secrets`, or create a project API token in [manage.sanity.io](https://www.sanity.io/manage) for **plugins-e2e-testing** (`a1psl692`).

**Do not use `SANITY_DEPLOY_TOKEN`.** That secret is for `sanity deploy` only and will fail auth preflight / studio login.

Ensure project `a1psl692` allows CORS origin `http://localhost:3333` (API → CORS origins in manage).

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

On pull requests, CI posts (and updates) an **E2E Tests** status comment with pass/fail/flaky/skipped counts and a link to the workflow run — same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity). The HTML report is uploaded as a workflow artifact (hosted report URL can land with the Vercel preview follow-up).

## Troubleshooting auth

1. **Missing secret/vars** — Config and CI fail fast if `SANITY_E2E_SESSION_TOKEN`, `SANITY_E2E_PROJECT_ID`, or `SANITY_E2E_STUDIO_DATASET` is unset, empty, or a placeholder (`changeme`, etc.). See the error pointing at this README.
2. **Deploy token used by mistake** — Auth preflight calls `GET /users/me`. A 401/403 usually means the wrong token kind; use a session/API token, not `SANITY_DEPLOY_TOKEN`.
3. **Project id mismatch** — Storage key is `__studio_auth_token_${SANITY_E2E_PROJECT_ID}`. If the studio uses a different project id, auth will look signed out.
4. **CORS** — Local origin must be allowed on the Sanity project.
5. **Login screen still visible** — Token invalid or storageState origin ≠ `SANITY_E2E_BASE_URL`.

## Follow-ups

Before the suite grows beyond read-only smoke (especially write-heavy tests or parallel PR CI), add the same production setup as Sanity’s main e2e workflow:

1. **Ephemeral per-PR datasets** — Create/cleanup datasets like `pr-<n>-chromium-<run_id>` so concurrent jobs do not race on shared `plugins`.
2. **Vercel preview hosting** — Deploy the studio under test and set `SANITY_E2E_BASE_URL` to the preview URL (skip local `webServer`). Also host the Playwright HTML report (so PR comments can link `[🟢 N passed](report#?q=s%3Apassed)` like `sanity-io/sanity`).

Without those, concurrent CI and mutating tests will flake or fail against the shared dataset / local preview.
