import type {RegisteredStudioScript, StudioScript} from './types'

const scriptModules = import.meta.glob<{default: StudioScript}>('./scripts/*/index.ts', {
  eager: true,
})

function validateScript(script: StudioScript, sourcePath: string): void {
  if (!script.name) {
    throw new Error(`Script in ${sourcePath} is missing a name`)
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(script.name)) {
    throw new Error(
      `Script "${script.name}" in ${sourcePath} must use lowercase letters, numbers, and hyphens`,
    )
  }

  if (!script.title) {
    throw new Error(`Script "${script.name}" in ${sourcePath} is missing a title`)
  }

  if (typeof script.run !== 'function') {
    throw new Error(`Script "${script.name}" in ${sourcePath} must export a run function`)
  }
}

function createScriptsRegistry(): RegisteredStudioScript[] {
  const registeredScripts: RegisteredStudioScript[] = Object.entries(scriptModules).map(
    ([sourcePath, module]) => {
      const script = module.default
      validateScript(script, sourcePath)
      return Object.assign({}, script, {sourcePath})
    },
  )

  const names = new Set<string>()
  for (const script of registeredScripts) {
    if (names.has(script.name)) {
      throw new Error(`Duplicate script name "${script.name}"`)
    }
    names.add(script.name)
  }

  return registeredScripts.sort(
    (a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name),
  )
}

export const scripts = createScriptsRegistry()

export function getScriptByName(name: string | undefined): RegisteredStudioScript | undefined {
  return scripts.find((script) => script.name === name)
}
