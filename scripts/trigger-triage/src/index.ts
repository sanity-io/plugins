#!/usr/bin/env node
import {getMiriadEnv, loadLocalEnv} from './env.ts'
import {fetchIssue, parseIssueUrl, type GitHubIssue} from './github.ts'
import {channelNameFor} from './issue-channel.ts'
import {MiriadRestClient} from './miriad-rest.ts'

const AGENT_NAMES = ['triager', 'squigler'] as const

const isTTY = process.stdout.isTTY
const color = (code: string, value: string): string =>
  isTTY ? `\x1b[${code}m${value}\x1b[0m` : value
const c = {
  blue: (value: string) => color('34', value),
  bold: (value: string) => color('1', value),
  gray: (value: string) => color('90', value),
  green: (value: string) => color('32', value),
  red: (value: string) => color('31', value),
  yellow: (value: string) => color('33', value),
}

interface Args {
  url: string | null
  dryRun: boolean
  verbose: boolean
  help: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {url: null, dryRun: false, verbose: false, help: false}

  if (argv.includes('--help') || argv.includes('-h')) {
    return {...args, help: true}
  }

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--verbose' || arg === '-v') args.verbose = true
    else if (arg.startsWith('-')) die(`Unknown flag: ${arg}. Run with --help for usage.`)
    else {
      if (args.url) die(`Unexpected extra argument: ${arg}`)
      args.url = arg
    }
  }

  return args
}

function printHelp(): void {
  process.stdout.write(`trigger-triage - kick off the Miriad triage workflow for a GitHub issue

Usage:
  trigger-triage <github-issue-url>
  trigger-triage --dry-run <github-issue-url>
  trigger-triage --verbose <github-issue-url>
  trigger-triage --help

Environment:
  MIRIAD_URL        Miriad REST API base URL (required, unless --dry-run)
  MIRIAD_TOKEN      Miriad bearer token (required, unless --dry-run)
  MIRIAD_SPACE_ID   Miriad space short id (required, unless --dry-run)
  GITHUB_TOKEN      Optional for local runs; GitHub Actions uses github.token

Agents:
  ${AGENT_NAMES.join(', ')} (hardcoded in src/index.ts)

Examples:
  trigger-triage https://github.com/sanity-io/plugins/issues/725
  trigger-triage --dry-run https://github.com/sanity-io/plugins/issues/725
`)
}

function die(msg: string): never {
  process.stderr.write(c.red(`error: ${msg}\n`))
  process.exit(1)
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

const IGNORED_LABELS = new Set(['automated', 'dependencies', 'duplicate', 'wontfix'])
const DEPENDENCY_DASHBOARD = /^Dependency Dashboard/

interface FilterResult {
  ignore: boolean
  reason?: string
}

function shouldIgnore(issue: GitHubIssue): FilterResult {
  if (issue.user.type === 'Bot' || issue.user.login.endsWith('[bot]')) {
    return {ignore: true, reason: `bot author (@${issue.user.login})`}
  }

  const hit = issue.labels.find((label) => IGNORED_LABELS.has(label.name.toLowerCase()))
  if (hit) return {ignore: true, reason: `label "${hit.name}"`}

  if (DEPENDENCY_DASHBOARD.test(issue.title)) {
    return {ignore: true, reason: 'dependency dashboard title'}
  }

  return {ignore: false}
}

function composeKickoff(owner: string, repo: string, issue: GitHubIssue): string {
  const labelNames = issue.labels.map((label) => label.name)
  const labelStr = labelNames.length > 0 ? labelNames.join(', ') : 'none'

  return [
    `@triager New issue in ${owner}/${repo}:`,
    '',
    `**#${issue.number} - ${issue.title}**`,
    '',
    '|  |  |',
    '| --- | --- |',
    `| Author | @${issue.user.login} |`,
    `| Labels | ${labelStr} |`,
    `| URL | ${issue.html_url} |`,
    '',
    'Please read the issue and all of its comments in full before forming a verdict.',
    'Apply the filters (bot authors, dependency dashboards, ignored labels) yourself.',
    'Follow the workflow in your SKILL.md end to end.',
  ].join('\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  if (!args.url) {
    printHelp()
    die('missing <github-issue-url>')
  }

  const log = (msg: string): void => {
    if (args.verbose) process.stderr.write(c.gray(`[debug] ${msg}\n`))
  }
  loadLocalEnv(log)

  let parsed: {owner: string; repo: string; issueNumber: number}
  try {
    parsed = parseIssueUrl(args.url)
  } catch (err) {
    die(errorMessage(err))
  }

  const {owner, repo, issueNumber} = parsed
  log(`parsed: owner=${owner} repo=${repo} issue=${issueNumber}`)

  const channelName = channelNameFor(repo, issueNumber)

  let issue: GitHubIssue
  try {
    issue = await fetchIssue({
      owner,
      repo,
      issueNumber,
      token: process.env.GITHUB_TOKEN,
      log,
    })
  } catch (err) {
    die(`failed to fetch issue: ${errorMessage(err)}`)
  }

  log(`fetched issue: "${issue.title}" by @${issue.user.login} (${issue.state})`)

  const filter = shouldIgnore(issue)
  if (filter.ignore) {
    process.stdout.write(c.yellow(`ignored: ${filter.reason}\n`))
    return
  }

  if (issue.state === 'closed') {
    process.stderr.write(
      c.yellow('warning: issue is closed - proceeding because needs-triage can be intentional\n'),
    )
  }

  const kickoff = composeKickoff(owner, repo, issue)

  if (args.dryRun) {
    process.stdout.write(c.blue(c.bold('DRY RUN\n')))
    process.stdout.write(c.gray(`channel: ${channelName}\n`))
    process.stdout.write(c.gray('--- kickoff message ---\n'))
    process.stdout.write(`${kickoff}\n`)
    process.stdout.write(c.gray('--- end ---\n'))
    process.stdout.write(c.green('dry-run complete (no Miriad REST call made)\n'))
    return
  }

  const env = getMiriadEnv()

  try {
    const client = new MiriadRestClient({
      url: env.url,
      token: env.token,
      spaceId: env.spaceId,
      log,
    })
    const channel = await client.ensureChannel(channelName)

    await Promise.all(AGENT_NAMES.map((agentName) => client.addAgent(channel.id, agentName)))

    await client.sendMessage(channel.id, kickoff)
  } catch (err) {
    die(`Miriad REST dispatch failed: ${errorMessage(err)}`)
  }

  process.stdout.write(
    c.green(`Triggered triage for ${owner}/${repo}#${issue.number} - channel: ${channelName}\n`),
  )
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  process.stderr.write(c.red(`error: ${msg}\n`))
  process.exit(1)
})
