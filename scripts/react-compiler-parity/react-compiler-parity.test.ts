import {mkdtemp, readdir, readFile, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {reactCompilerPluginForVitest} from '@sanity/plugin-kit/vitest'
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

const JSX_ONLY_SOURCE = `
export function Box() {
  return <div data-testid="box">ok</div>
}
`

const SETUP_SOURCE = `import * as _jestDom from '@testing-library/jest-dom/vitest'\n`

/**
 * Every plugin that enables React Compiler in `tsdown.config.ts` must also
 * run Vitest through `reactCompilerPluginForVitest()` from
 * `@sanity/plugin-kit/vitest`, so unit tests exercise the same compiled
 * output that ships to npm. Generators wire both; this test stops agents
 * from forgetting one side.
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
          return `${relativePlugin}: tsdown has reactCompiler but vitest.config.ts does not register reactCompilerPluginForVitest() from @sanity/plugin-kit/vitest`
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

test('the plugin compiles a component in Vitest', {timeout: 30_000}, async () => {
  const unfixed = await transformFixture([])
  const compiled = await transformFixture([reactCompilerPluginForVitest()])

  expect(unfixed, 'without the plugin the compiler must not run').not.toContain(
    'react/compiler-runtime',
  )
  expect(compiled, 'with the plugin the compiler must run').toContain('react/compiler-runtime')
})

test('the plugin compiles JSX-only modules without a react import', {timeout: 30_000}, async () => {
  const compiled = await transformFixture([reactCompilerPluginForVitest()], {
    fileName: 'Box.tsx',
    source: JSX_ONLY_SOURCE,
  })
  expect(compiled, 'automatic-runtime JSX must compile').toContain('react/compiler-runtime')
})

test('the plugin skips non-JSX modules that do not import react', () => {
  const {transform} = reactCompilerPluginForVitest()
  if (!transform || typeof transform === 'function' || !('handler' in transform)) {
    throw new Error('expected an object transform hook')
  }
  expect(
    Reflect.apply(transform.handler, undefined, [SETUP_SOURCE, '/virtual/setup.ts']),
    'setup files must stay untouched so oxc DCE cannot drop jest-dom side-effect imports',
  ).toBeNull()
})

test('assist vitest config compiles a component in Vitest', {timeout: 30_000}, async () => {
  const {default: assistVitestConfig} = await import(
    path.join(repoRoot, 'plugins/@sanity/assist/vitest.config.ts')
  )
  const code = await transformFixture(
    Array.isArray(assistVitestConfig.plugins)
      ? assistVitestConfig.plugins
      : assistVitestConfig.plugins
        ? [assistVitestConfig.plugins]
        : [],
  )
  expect(code).toContain('react/compiler-runtime')
})

/**
 * Transforms a fixture through the same server-side Vite pipeline Vitest uses,
 * which is exactly where `@vitejs/plugin-react` `compiler: true` never applies.
 */
async function transformFixture(
  plugins: PluginOption[],
  fixture: {fileName: string; source: string} = {
    fileName: 'Counter.tsx',
    source: COUNTER_SOURCE,
  },
) {
  const root = await mkdtemp(path.join(tmpdir(), 'react-compiler-parity-'))
  await writeFile(path.join(root, fixture.fileName), fixture.source)

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    plugins,
    server: {middlewareMode: true},
    appType: 'custom',
  })

  try {
    const result = await server.environments.ssr.transformRequest(`/${fixture.fileName}`)
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
  return (
    vitestSource.includes("'@sanity/plugin-kit/vitest'") &&
    vitestSource.includes('reactCompilerPluginForVitest(')
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
