import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {expect, test} from 'vitest'

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')
const pluginsRoot = path.join(repoRoot, 'plugins')

/**
 * Every plugin that enables React Compiler in `tsdown.config.ts` must also
 * run Vitest through the same `@rolldown/plugin-babel` + `reactCompilerPreset`
 * stack. Generators wire both; this test stops agents from forgetting one side.
 *
 * See AGENTS.md ("React Compiler Vitest parity") and
 * turbo/generators/templates/vitest.config.ts.hbs.
 */
test('plugins with reactCompiler in tsdown also enable it in vitest', async () => {
  const tsdownConfigs = await findFiles(pluginsRoot, 'tsdown.config.ts')
  const mismatches: string[] = []

  for (const tsdownPath of tsdownConfigs) {
    const tsdownSource = await readFile(tsdownPath, 'utf8')
    if (!enablesReactCompiler(tsdownSource)) continue

    const pluginDir = path.dirname(tsdownPath)
    const vitestPath = path.join(pluginDir, 'vitest.config.ts')
    let vitestSource: string
    try {
      vitestSource = await readFile(vitestPath, 'utf8')
    } catch {
      mismatches.push(
        `${path.relative(repoRoot, pluginDir)}: missing vitest.config.ts (tsdown has reactCompiler)`,
      )
      continue
    }

    if (!enablesReactCompilerInVitest(vitestSource)) {
      mismatches.push(
        `${path.relative(repoRoot, pluginDir)}: tsdown has reactCompiler but vitest.config.ts does not use reactCompilerPreset / @rolldown/plugin-babel`,
      )
    }
  }

  expect(
    mismatches,
    [
      'React Compiler must be enabled in both tsdown.config.ts and vitest.config.ts.',
      'Generators already wire both — see turbo/generators/templates/vitest.config.ts.hbs.',
      'Documented in AGENTS.md under "React Compiler Vitest parity".',
      '',
      ...mismatches,
    ].join('\n'),
  ).toEqual([])
})

function enablesReactCompiler(tsdownSource: string): boolean {
  // Match `reactCompiler: true` or `reactCompiler: { ... }` — not `reactCompiler: false`.
  return /reactCompiler\s*:\s*(?!false\b)/.test(tsdownSource)
}

function enablesReactCompilerInVitest(vitestSource: string): boolean {
  return (
    vitestSource.includes('reactCompilerPreset') || vitestSource.includes('@rolldown/plugin-babel')
  )
}

async function findFiles(root: string, fileName: string): Promise<string[]> {
  const results: string[] = []

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, {withFileTypes: true})
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name === fileName) {
        results.push(fullPath)
      }
    }
  }

  await walk(root)
  return results.sort()
}
