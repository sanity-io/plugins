# Issue Triage Trigger

This package triggers the Miriad issue triage workflow for a GitHub issue URL.
It is used by the `sanity-io/plugins` GitHub workflow and can also be run from
the terminal while developing or testing.

The runtime path is dependency-free: the GitHub Action runs the TypeScript file
directly with Node, without `pnpm install` or a build step. Use Node 22.18 or
newer locally.

## How It Works

### On new issues

Given a GitHub issue URL, the default CLI path:

1. Parses the owner, repo, and issue number.
2. Fetches the issue from the GitHub REST API.
3. Ignores noise, including bot authors, dependency dashboards, and issues with
   ignored labels.
4. Creates or reuses a Miriad channel named after the repo and issue number.
5. Adds the configured Miriad agents to the channel.
6. Posts a kickoff message tagging `@triager`.

The trigger does not post back to GitHub. It only starts the Miriad workflow.

### On closed issues

A separate archive entrypoint handles closed issues. It skips issue fetching,
derives the expected channel name from the issue URL, finds that channel in
Miriad, and archives it:

```bash
node scripts/trigger-triage/src/archive.ts https://github.com/sanity-io/plugins/issues/725
```

## GitHub Workflow

The workflow that calls this package is:

```text
.github/workflows/issue-triage.yml
```

It runs when:

- A new issue is opened.
- The `needs-triage` label is added to an existing issue.
- An issue is closed, which archives the matching Miriad channel.
- A developer manually runs the workflow from the GitHub Actions UI and provides
  an `issue_url` input.

For issue events, the workflow passes `github.event.issue.html_url` to the CLI.
For manual runs, it passes the `issue_url` input instead.

```bash
node scripts/trigger-triage/src/index.ts "$ISSUE_URL"
```

Closed issue events run the archive mode:

```bash
node scripts/trigger-triage/src/archive.ts "$ISSUE_URL"
```

Archive mode calls the Miriad REST API equivalent of:

```bash
curl -X POST "$MIRIAD_URL/channels/$CHANNEL_ID/archive" \
  -H "Authorization: Bearer $MIRIAD_TOKEN"
```

To trigger it manually, open the `Issue Triage` workflow in GitHub Actions, click
`Run workflow`, and paste a GitHub issue URL such as
`https://github.com/sanity-io/plugins/issues/725`.

## Local Usage

From the repository root:

```bash
pnpm issue-triage https://github.com/sanity-io/plugins/issues/725
```

Dry-run mode fetches and filters the issue, then prints the Miriad kickoff
message without calling Miriad:

```bash
pnpm issue-triage --dry-run https://github.com/sanity-io/plugins/issues/725
```

Verbose mode prints debug logs:

```bash
pnpm issue-triage --verbose https://github.com/sanity-io/plugins/issues/725
```

Archive the Miriad channel for a closed issue:

```bash
node scripts/trigger-triage/src/archive.ts https://github.com/sanity-io/plugins/issues/725
```

## Required GitHub Actions Secrets

Add these to the target repository's GitHub Actions secrets:

- `MIRIAD_URL` - Miriad REST API base URL.
- `MIRIAD_TOKEN` - Bearer token for the Miriad REST API.
- `MIRIAD_SPACE_ID` - Miriad space short id.

The workflow sets `GITHUB_TOKEN` from GitHub's built-in token:

```yaml
GITHUB_TOKEN: ${{ github.token }}
```

Do not add a custom `GITHUB_TOKEN` repository secret for this workflow.

## Local Environment

For local terminal runs, `GITHUB_TOKEN` is optional. Set it only if anonymous
GitHub API requests hit rate limits or if you are testing against a private
repository.

```bash
GITHUB_TOKEN=ghp_example pnpm issue-triage --dry-run https://github.com/sanity-io/plugins/issues/725
```

The script also loads local `.env` files automatically without any dependencies.
Shell-provided environment variables always win. For local Miriad runs, copy the
example file and fill in the required values:

```bash
cp scripts/trigger-triage/.env.example scripts/trigger-triage/.env
```

The lookup order is:

1. Environment variables already set in the shell or GitHub Actions.
2. `scripts/trigger-triage/.env`.
3. Repository root `.env`.

The script-local `.env` is preferred because it keeps these secrets scoped to
this helper. The root `.env` fallback exists for convenience in this repo.

## Hardcoded Agents

The Miriad agents are intentionally hardcoded in `src/index.ts`:

```ts
const AGENT_NAMES = ['triager', 'squiggler'] as const
```

This keeps the GitHub workflow and repository settings small: agent assignment
is part of the script behavior, not deployment configuration. If another repo or
Miriad workspace uses different callsigns, update `AGENT_NAMES` before copying
or enabling the workflow there.

## Moving This To Another Repo

To reuse this setup in another repository, such as the main `sanity` repo:

1. Copy `scripts/trigger-triage/`.
2. Copy `.github/workflows/issue-triage.yml`.
3. Add the script package to that repository's package manager or workspace
   setup.
4. Create a new Miriad workspace. From this workspace you will get:
   - `MIRIAD_URL`
   - `MIRIAD_TOKEN`
   - `MIRIAD_SPACE_ID`
     Add these variables to the repository secrets.
5. Review `AGENT_NAMES` in `src/index.ts` and update the callsigns if the target
   Miriad workspace uses different agents.
6. Confirm the workflow passes `github.event.issue.html_url` to the CLI.
7. Confirm the manual `workflow_dispatch` input is still named `issue_url`.
8. Run a local dry-run against a real issue URL.
9. Smoke-test the workflow by opening a test issue or adding `needs-triage` to
   an existing issue.
10. Close the test issue and confirm the matching Miriad channel is archived.
