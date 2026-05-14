import {describe, expect, test, vi} from 'vitest'

import type {FetchIssueOptions, GitHubIssue} from './github.ts'
import {runTriage, type TriageMiriadClient} from './index.ts'
import type {MiriadChannel} from './miriad-rest.ts'

const env = {
  MIRIAD_URL: 'https://miriad.example',
  MIRIAD_TOKEN: 'token',
  MIRIAD_SPACE_ID: 'space',
}

describe('triage CLI args', () => {
  test('help wins over unknown flags through runTriage', async () => {
    const result = await runTriage({argv: ['--help', '--unknown'], env})

    expect(result.stdout.join('')).toContain('trigger-triage - kick off the Miriad triage workflow')
    expect(result.stderr).toEqual([])
    expect(result.exitCode).toBe(0)
  })

  test('missing issue URL is handled by runTriage', async () => {
    const result = await runTriage({argv: [], env})

    expect(result.stdout.join('')).toContain('trigger-triage - kick off the Miriad triage workflow')
    expect(result.stderr.join('')).toContain('missing <github-issue-url>')
    expect(result.exitCode).toBe(1)
  })
})

describe('runTriage', () => {
  test('dry-run fetches GitHub and does not call Miriad', async () => {
    const fetchIssue = vi.fn(async (_opts: FetchIssueOptions): Promise<GitHubIssue> => issue())
    const createMiriadClient = vi.fn((): TriageMiriadClient => createTriageClient(channel()))

    const result = await runTriage({
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
    expect(result.stdout.join('')).toContain('dry-run complete')
  })

  test('ignores bot-authored issues without calling Miriad', async () => {
    const fetchIssue = vi.fn(
      async (_opts: FetchIssueOptions): Promise<GitHubIssue> =>
        issue({user: {login: 'dependabot[bot]', type: 'Bot'}}),
    )
    const createMiriadClient = vi.fn((): TriageMiriadClient => createTriageClient(channel()))

    const result = await runTriage({issueUrl: issueUrl(660), env, fetchIssue, createMiriadClient})

    expect(createMiriadClient).not.toHaveBeenCalled()
    expect(result.stdout.join('')).toContain('ignored: bot author (@dependabot[bot])')
  })

  test('ignores dependency labels without calling Miriad', async () => {
    const fetchIssue = vi.fn(
      async (_opts: FetchIssueOptions): Promise<GitHubIssue> =>
        issue({labels: [{name: 'dependencies'}]}),
    )
    const createMiriadClient = vi.fn((): TriageMiriadClient => createTriageClient(channel()))

    const result = await runTriage({issueUrl: issueUrl(660), env, fetchIssue, createMiriadClient})

    expect(createMiriadClient).not.toHaveBeenCalled()
    expect(result.stdout.join('')).toContain('ignored: label "dependencies"')
  })

  test('ignores dependency dashboards without calling Miriad', async () => {
    const fetchIssue = vi.fn(
      async (_opts: FetchIssueOptions): Promise<GitHubIssue> =>
        issue({title: 'Dependency Dashboard'}),
    )
    const createMiriadClient = vi.fn((): TriageMiriadClient => createTriageClient(channel()))

    const result = await runTriage({issueUrl: issueUrl(660), env, fetchIssue, createMiriadClient})

    expect(createMiriadClient).not.toHaveBeenCalled()
    expect(result.stdout.join('')).toContain('ignored: dependency dashboard title')
  })

  test('dispatches to an existing channel', async () => {
    const client = createTriageClient(channel({id: 'existing-channel'}))

    const result = await runTriage({
      issueUrl: issueUrl(660),
      env,
      fetchIssue: async () => issue({number: 660}),
      createMiriadClient: () => client,
    })

    expect(client.calls.ensureChannel).toEqual(['plugins-issue-660'])
    expect(client.calls.addAgent).toEqual([
      {channelId: 'existing-channel', name: 'triager'},
      {channelId: 'existing-channel', name: 'squiggler'},
    ])
    expect(client.calls.sendMessage).toHaveLength(1)
    expect(client.calls.sendMessage[0]?.content).toContain('@triager New issue')
    expect(result.stdout.join('')).toContain('Triggered triage for sanity-io/plugins#660')
  })

  test('surfaces missing Miriad environment before dispatch', async () => {
    const client = createTriageClient(channel())

    await expect(
      runTriage({
        issueUrl: issueUrl(660),
        env: {},
        fetchIssue: async () => issue(),
        createMiriadClient: () => client,
      }),
    ).rejects.toThrow('MIRIAD_URL is not set')

    expect(client.calls.ensureChannel).toEqual([])
  })

  test('surfaces GitHub fetch errors', async () => {
    await expect(
      runTriage({
        issueUrl: issueUrl(660),
        env,
        fetchIssue: async () => {
          throw new Error('GitHub unavailable')
        },
      }),
    ).rejects.toThrow('GitHub unavailable')
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
    state: 'open',
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

function createTriageClient(channelResult: MiriadChannel): TriageMiriadClient & {
  calls: {
    ensureChannel: string[]
    addAgent: {channelId: string; name: string}[]
    sendMessage: {channelId: string; content: string}[]
  }
} {
  const calls = {
    ensureChannel: [] as string[],
    addAgent: [] as {channelId: string; name: string}[],
    sendMessage: [] as {channelId: string; content: string}[],
  }

  return {
    calls,
    async ensureChannel(name) {
      calls.ensureChannel.push(name)
      return channelResult
    },
    async addAgent(channelId, name) {
      calls.addAgent.push({channelId, name})
      return null
    },
    async sendMessage(channelId, content) {
      calls.sendMessage.push({channelId, content})
    },
  }
}
