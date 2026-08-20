import {mkdtemp, readdir, readFile, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {transformSync} from 'oxc-transform-react'
import {createServer, type PluginOption} from 'vite'
import {expect, test} from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const pluginsRoot = path.join(repoRoot, 'plugins')

const COUNTER_SOURCE = `
import {useState} from 'react'
export function Counter() {
  const [n, setN] = useState(0)
  return <button type="button" onClick={() => setN(n + 1)}>{n}</button>
}
`

/**
 * Every plugin that enables React Compiler in `tsdown.config.ts` must also
 * run Vitest through `oxc-transform-react` via `reactCompilerPluginForVitest()`.
 * Generators wire both; this test stops agents from forgetting one side.
 *
 * See AGENTS.md ("React Compiler Vitest parity") and
 * turbo/generators/templates/vitest.config.ts.hbs.
 */
test('plugins with reactCompiler in tsdown also enable it in vitest', async () => {
  const tsdownConfigs = await findFiles(pluginsRoot, 'tsdown.config.ts')

  const results = await Promise.all(
    tsdownConfigs.map(async (tsdownPath) => {
      const tsdownSource = await readFile(tsdownPath, 'utf8')
      if (!enablesReactCompiler(tsdownSource)) return null

      const pluginDir = path.dirname(tsdownPath)
      const vitestPath = path.join(pluginDir, 'vitest.config.ts')
      const relativePlugin = path.relative(repoRoot, pluginDir)

      try {
        const vitestSource = await readFile(vitestPath, 'utf8')
        if (!enablesReactCompilerInVitest(vitestSource)) {
          return `${relativePlugin}: tsdown has reactCompiler but vitest.config.ts does not wire reactCompilerPluginForVitest() with oxc-transform-react (reactCompiler: true)`
        }
      } catch {
        return `${relativePlugin}: missing vitest.config.ts (tsdown has reactCompiler)`
      }

      return null
    }),
  )

  const mismatches = results.filter((message): message is string => message !== null)

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

test('oxc plugin compiles a component in Vite SSR', {timeout: 30_000}, async () => {
  const unfixed = await transformFixtureSsr([])
  const compiled = await transformFixtureSsr([reactCompilerPluginForVitest()])

  expect(unfixed, 'Vite SSR without the plugin must not compile').not.toContain(
    'react/compiler-runtime',
  )
  expect(compiled, 'oxc plugin must compile under consumer: server').toContain(
    'react/compiler-runtime',
  )
})

test('assist vitest config compiles a component in Vite SSR', {timeout: 30_000}, async () => {
  const {default: assistVitestConfig} = await import(
    path.join(repoRoot, 'plugins/@sanity/assist/vitest.config.ts')
  )
  const code = await transformFixtureSsr(
    Array.isArray(assistVitestConfig.plugins)
      ? assistVitestConfig.plugins
      : assistVitestConfig.plugins
        ? [assistVitestConfig.plugins]
        : [],
  )
  expect(code).toContain('react/compiler-runtime')
})

function reactCompilerPluginForVitest() {
  return {
    name: 'vitest-react-compiler',
    enforce: 'pre' as const,
    transform: {
      filter: {id: {include: /\.[tj]sx?(?:\?|$)/, exclude: /\/node_modules\//}},
      handler(code: string, id: string) {
        const filename = id.includes('?') ? id.slice(0, id.indexOf('?')) : id
        const result = transformSync(filename, code, {
          jsx: {runtime: 'automatic'},
          reactCompiler: true,
          sourcemap: true,
        })
        if (result.fatal) {
          throw new Error(
            result.errors.map((error) => error.message).join('\n') ||
              'React Compiler transform failed.',
          )
        }
        return {code: result.code, map: result.map}
      },
    },
  }
}

async function transformFixtureSsr(plugins: PluginOption[]) {
  const root = await mkdtemp(path.join(tmpdir(), 'react-compiler-parity-'))
  await writeFile(path.join(root, 'Counter.tsx'), COUNTER_SOURCE)

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    plugins,
    server: {middlewareMode: true},
    appType: 'custom',
  })

  try {
    const result = await server.environments.ssr.transformRequest('/Counter.tsx')
    return result?.code ?? ''
  } finally {
    await server.close()
  }
}

function enablesReactCompiler(tsdownSource: string): boolean {
  // Match `reactCompiler: true` or `reactCompiler: { ... }` — not `reactCompiler: false`.
  return /reactCompiler\s*:\s*(?!false\b)/.test(tsdownSource)
}

function enablesReactCompilerInVitest(vitestSource: string): boolean {
  // Require the oxc stack. `@vitejs/plugin-react` `compiler: true` is client-only.
  return (
    vitestSource.includes('oxc-transform-react') &&
    vitestSource.includes('reactCompilerPluginForVitest(') &&
    /reactCompiler\s*:\s*true/.test(vitestSource)
  )
}

async function findFiles(root: string, fileName: string): Promise<string[]> {
  const results: string[] = []

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, {withFileTypes: true})
    await Promise.all(
      entries.map(async (entry) => {
        if (entry.name === 'node_modules' || entry.name === 'dist') return
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(fullPath)
        } else if (entry.name === fileName) {
          results.push(fullPath)
        }
      }),
    )
  }

  await walk(root)
  return results.sort()
}
