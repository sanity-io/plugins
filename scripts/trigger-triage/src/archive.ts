#!/usr/bin/env node
import {getMiriadEnv, loadLocalEnv} from './env.ts'
import {parseIssueUrl} from './github.ts'
import {channelNameFor} from './issue-channel.ts'
import {MiriadRestClient} from './miriad-rest.ts'

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

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--dry-run') args.dryRun = true
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
  process.stdout.write(`archive-triage-channel - archive the Miriad channel for a GitHub issue

Usage:
  archive-triage-channel <github-issue-url>
  archive-triage-channel --dry-run <github-issue-url>
  archive-triage-channel --verbose <github-issue-url>
  archive-triage-channel --help

Environment:
  MIRIAD_URL        Miriad REST API base URL (required, unless --dry-run)
  MIRIAD_TOKEN      Miriad bearer token (required, unless --dry-run)
  MIRIAD_SPACE_ID   Miriad space short id (required, unless --dry-run)

Examples:
  archive-triage-channel https://github.com/sanity-io/plugins/issues/660
  archive-triage-channel --dry-run https://github.com/sanity-io/plugins/issues/660
`)
}

function die(msg: string): never {
  process.stderr.write(c.red(`error: ${msg}\n`))
  process.exit(1)
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
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
  const channelName = channelNameFor(repo, issueNumber)
  log(`parsed: owner=${owner} repo=${repo} issue=${issueNumber}`)
  log(`channel: ${channelName}`)

  if (args.dryRun) {
    process.stdout.write(c.blue(c.bold('DRY RUN\n')))
    process.stdout.write(c.gray(`channel: ${channelName}\n`))
    process.stdout.write(c.green('dry-run complete (no Miriad archive call made)\n'))
    return
  }

  try {
    const env = getMiriadEnv()
    const client = new MiriadRestClient({
      url: env.url,
      token: env.token,
      spaceId: env.spaceId,
      log,
    })

    const channel = await client.findChannelByName(channelName)
    if (!channel) {
      process.stdout.write(
        c.yellow(
          `No active Miriad channel found for ${owner}/${repo}#${issueNumber}; it may already be archived\n`,
        ),
      )
      return
    }

    await client.archiveChannel(channel.id)
    process.stdout.write(
      c.green(`Archived Miriad channel for ${owner}/${repo}#${issueNumber}: ${channelName}\n`),
    )
  } catch (err) {
    die(`Miriad archive failed: ${errorMessage(err)}`)
  }
}

main().catch((err: unknown) => {
  process.stderr.write(c.red(`error: ${errorMessage(err)}\n`))
  process.exit(1)
})
