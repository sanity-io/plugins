/**
 * Parse a GitHub remote URL (https, git+ssh, or scp-style) into user/repo.
 * Replaces the untyped `github-url-to-object` package.
 */
export function githubUrlToObject(url: string): {user: string; repo: string} | undefined {
  if (!url) {
    return undefined
  }

  const trimmed = url.trim()

  // git@github.com:user/repo(.git)
  const scp = trimmed.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i)
  if (scp) {
    return {user: scp[1], repo: scp[2]}
  }

  try {
    const normalized = trimmed
      .replace(/^git\+/, '')
      .replace(/^ssh:\/\/git@github\.com\//i, 'https://github.com/')
      .replace(/^git:\/\/github\.com\//i, 'https://github.com/')
    const parsed = new URL(normalized)
    if (!/(^|\.)github\.com$/i.test(parsed.hostname)) {
      return undefined
    }
    const [, user, repoWithGit] = parsed.pathname.split('/')
    if (!user || !repoWithGit) {
      return undefined
    }
    return {user, repo: repoWithGit.replace(/\.git$/i, '')}
  } catch {
    return undefined
  }
}
