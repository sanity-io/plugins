import {execa} from 'execa'

import {prompt} from '../util/prompt'

function npmIsAvailable() {
  return execa('npm', ['-v'])
    .then(() => true)
    .catch(() => false)
}

function yarnIsAvailable() {
  return execa('yarn', ['-v'])
    .then(() => true)
    .catch(() => false)
}

function pnpmAvailable() {
  return execa('pnpm', ['-v'])
    .then(() => true)
    .catch(() => false)
}

export async function promptForPackageManager() {
  const [npm, yarn, pnpm] = await Promise.all([
    npmIsAvailable(),
    yarnIsAvailable(),
    pnpmAvailable(),
  ])

  const choices = [npm && 'npm', yarn && 'yarn', pnpm && 'pnpm'].filter(Boolean)
  if (choices.length < 2) {
    return choices[0] || 'npm'
  }

  return prompt('Which package manager do you prefer?', {
    choices: choices.map((value) => ({value, name: value})),
    default: choices[0],
  })
}

export async function installDependencies(pm: string, {cwd}: {cwd?: string}) {
  // `reject: false` covers non-zero exits; try/catch covers spawn failures (e.g. ENOENT
  // when the package manager binary is missing) so the caller can print its hint
  try {
    const {exitCode} = await execa(pm, ['install'], {cwd, stdio: 'inherit', reject: false})
    return exitCode === 0
  } catch {
    return false
  }
}
