export function channelNameFor(repo: string, issueNumber: number): string {
  if (repo === 'plugins') return `plugins-issue-${issueNumber}`
  return `${repo}-issue-${issueNumber}`
}
