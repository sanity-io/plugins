import {describe, expect, test, vi} from 'vitest'

import {runArchive, type ArchiveMiriadClient} from './archive.ts'
import type {FetchIssueOptions, GitHubIssue} from './github.ts'
import type {MiriadChannel} from './miriad-rest.ts'

const env = {
  MIRIAD_URL: 'https://miriad.example',
  MIRIAD_TOKEN: 'token',
  MIRIAD_SPACE_ID: 'space',
}

describe('archive CLI args', () => {
  test('help wins over unknown flags through runArchive', async () => {
    const result = await runArchive({argv: ['--help', '--unknown'], env})

    expect(result.stdout.join('')).toContain('archive-triage-channel - archive the Miriad channel')
    expect(result.stderr).toEqual([])
    expect(result.exitCode).toBe(0)
  })

  test('missing issue URL is handled by runArchive', async () => {
    const result = await runArchive({argv: [], env})

    expect(result.stdout.join('')).toContain('archive-triage-channel - archive the Miriad channel')
    expect(result.stderr.join('')).toContain('missing <github-issue-url>')
    expect(result.exitCode).toBe(1)
  })
})

describe('runArchive', () => {
  test('dry-run derives the channel name without calling Miriad', async () => {
    const fetchIssue = vi.fn(async (_opts: FetchIssueOptions): Promise<GitHubIssue> => issue())
    const createMiriadClient = vi.fn((): ArchiveMiriadClient => createArchiveClient(channel()))

    const result = await runArchive({
      issueUrl: issueUrl(660),
      dryRun: true,
      env,
      fetchIssue,
      createMiriadClient,
    })

    expect(fetchIssue).toHaveBeenCalledWith(
      expect.objectContaining({owner: 'sanity-io', repo: 'plugins', issueNumber: 660}),
    )
    expect(createMiriadClient).not.toHaveBeenCalled()
    expect(result.stdout.join('')).toContain('DRY RUN')
    expect(result.stdout.join('')).toContain('plugins-issue-660')
  })

  test('ignored issues do not query Miriad', async () => {
    const fetchIssue = vi.fn(
      async (_opts: FetchIssueOptions): Promise<GitHubIssue> =>
        issue({labels: [{name: 'dependencies'}]}),
    )
    const createMiriadClient = vi.fn((): ArchiveMiriadClient => createArchiveClient(channel()))

    const result = await runArchive({
      issueUrl: issueUrl(660),
      env,
      fetchIssue,
      createMiriadClient,
    })

    expect(createMiriadClient).not.toHaveBeenCalled()
    expect(result.stdout.join('')).toContain('ignored: label "dependencies"')
  })

  test('archives a matching active channel', async () => {
    const client = createArchiveClient(channel({id: 'active-channel'}))

    const result = await runArchive({
      issueUrl: issueUrl(660),
      env,
      fetchIssue: async () => issue(),
      createMiriadClient: () => client,
    })

    expect(client.calls.findChannelByName).toEqual(['plugins-issue-660'])
    expect(client.calls.archiveChannel).toEqual(['active-channel'])
    expect(result.stdout.join('')).toContain('Archived Miriad channel for sanity-io/plugins#660')
  })

  test('skips when no active channel is found', async () => {
    const client = createArchiveClient(null)

    const result = await runArchive({
      issueUrl: issueUrl(660),
      env,
      fetchIssue: async () => issue(),
      createMiriadClient: () => client,
    })

    expect(client.calls.findChannelByName).toEqual(['plugins-issue-660'])
    expect(client.calls.archiveChannel).toEqual([])
    expect(result.stdout.join('')).toContain('may already be archived')
  })

  test('fails before Miriad calls when env is missing', async () => {
    const client = createArchiveClient(channel())

    await expect(
      runArchive({
        issueUrl: issueUrl(660),
        env: {},
        fetchIssue: async () => issue(),
        createMiriadClient: () => client,
      }),
    ).rejects.toThrow('MIRIAD_URL is not set')

    expect(client.calls.findChannelByName).toEqual([])
  })

  test('surfaces invalid issue URLs', async () => {
    await expect(runArchive({issueUrl: 'nope', env})).rejects.toThrow('invalid GitHub issue URL')
  })

  test('surfaces archive endpoint failures', async () => {
    const client = createArchiveClient(channel(), new Error('archive failed'))

    await expect(
      runArchive({
        issueUrl: issueUrl(660),
        env,
        fetchIssue: async () => issue(),
        createMiriadClient: () => client,
      }),
    ).rejects.toThrow('archive failed')
  })
})

function issueUrl(issueNumber: number): string {
  return `https://github.com/sanity-io/plugins/issues/${issueNumber}`
}

function issue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
  return {
    number: 660,
    title: 'Example issue',
    body: null,
    html_url: issueUrl(overrides.number ?? 660),
    state: 'closed',
    created_at: '2026-05-14T00:00:00Z',
    user: {login: 'pedrobonamin', type: 'User'},
    labels: [],
    ...overrides,
  }
}

function channel(overrides: Partial<MiriadChannel> = {}): MiriadChannel {
  return {
    id: 'channel-id',
    name: 'plugins-issue-660',
    displayName: null,
    archived: false,
    ...overrides,
  }
}

function createArchiveClient(
  channelResult: MiriadChannel | null,
  archiveError?: Error,
): ArchiveMiriadClient & {
  calls: {
    findChannelByName: string[]
    archiveChannel: string[]
  }
} {
  const calls = {
    findChannelByName: [] as string[],
    archiveChannel: [] as string[],
  }

  return {
    calls,
    async findChannelByName(name) {
      calls.findChannelByName.push(name)
      return channelResult
    },
    async archiveChannel(channelId) {
      calls.archiveChannel.push(channelId)
      if (archiveError) throw archiveError
      return channelResult ?? channel({id: channelId})
    },
  }
}
