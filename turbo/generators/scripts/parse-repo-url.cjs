#!/usr/bin/env node
// Helper script to parse git repository URLs
// This is executed via execSync to avoid bundling issues with turbo gen

const hostedGitInfo = require('hosted-git-info')

const repoUrl = process.argv[2]
if (!repoUrl) {
  console.error('Usage: parse-repo-url.cjs <repo-url>')
  process.exit(1)
}

const info = hostedGitInfo.fromUrl(repoUrl)
if (!info) {
  // oxlint-disable-next-line no-console
  console.log(JSON.stringify({repositoryUrl: null, sourceUrl: null}))
  process.exit(0)
}

const repositoryUrl = info.browse()
const directory = process.argv[3] // Optional directory parameter

// If there's a directory, construct a URL to that path in the repo
const sourceUrl = directory ? `${repositoryUrl}/tree/main/${directory}` : repositoryUrl

// oxlint-disable-next-line no-console
console.log(JSON.stringify({repositoryUrl, sourceUrl}))
process.exit(0)
