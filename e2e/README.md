# E2E Testing (Smoke)

Playwright smoke tests for the plugins [test studio](../dev/test-studio). Auth follows the same pattern as [`sanity-io/sanity`](https://github.com/sanity-io/sanity): bots never click “Sign in”; Playwright seeds Studio’s `__studio_auth_token_<projectId>` localStorage via `storageState`.

## Required secrets

| Variable                   | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `SANITY_E2E_SESSION_TOKEN` | Studio session/API token used for browser auth (required in CI)           |
| `STUDIO_AUTH_TOKEN`        | Fallback for Cursor cloud agents when `SANITY_E2E_SESSION_TOKEN` is unset |
| `SANITY_E2E_PROJECT_ID`    | Project id (default `ppsg7ml5`) — must match the storage key suffix       |
| `SANITY_E2E_BASE_URL`      | Studio origin (default `http://localhost:3333`)                           |
| `SANITY_STUDIO_DATASET`    | Dataset (default `plugins`)                                               |

Copy [`e2e/.env.example`](./.env.example) to `e2e/.env.local` and fill in the token, or export the vars in your shell.

Get a token via `sanity login` then `sanity debug --secrets`, or create a project API token in [manage.sanity.io](https://www.sanity.io/manage).

**Do not use `SANITY_DEPLOY_TOKEN`.** That secret is for `sanity deploy` only and will fail auth preflight / studio login.

Ensure the project allows CORS origin `http://localhost:3333` (API → CORS origins in manage).

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

## Troubleshooting auth

1. **Missing secret** — Config and CI fail fast if `SANITY_E2E_SESSION_TOKEN` / `STUDIO_AUTH_TOKEN` is unset, empty, or a placeholder (`changeme`, etc.). See the error pointing at this README.
2. **Deploy token used by mistake** — Auth preflight calls `GET /users/me`. A 401/403 usually means the wrong token kind; use a session/API token, not `SANITY_DEPLOY_TOKEN`.
3. **Project id mismatch** — Storage key is `__studio_auth_token_${SANITY_E2E_PROJECT_ID}`. If the studio uses a different project id, auth will look signed out.
4. **CORS** — Local origin must be allowed on the Sanity project.
5. **Login screen still visible** — Token invalid or storageState origin ≠ `SANITY_E2E_BASE_URL`.

## Follow-ups

Before the suite grows beyond read-only smoke (especially write-heavy tests or parallel PR CI), add the same production setup as Sanity’s main e2e workflow:

1. **Ephemeral per-PR datasets** — Create/cleanup datasets like `pr-<n>-chromium-<run_id>` so concurrent jobs do not race on shared `plugins`.
2. **Vercel preview hosting** — Deploy the studio under test and set `SANITY_E2E_BASE_URL` to the preview URL (skip local `webServer`).

Without those, concurrent CI and mutating tests will flake or fail against the shared dataset / local preview.
