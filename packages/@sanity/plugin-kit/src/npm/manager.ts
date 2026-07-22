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
  // `reject: false` so a failed install returns false (and the caller prints a hint)
  // instead of bubbling up as an unhandled CLI error
  const {exitCode} = await execa(pm, ['install'], {cwd, stdio: 'inherit', reject: false})
  return exitCode === 0
}
