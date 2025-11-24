import path from 'node:path'
import {defineCliConfig} from 'sanity/cli'
import {mergeConfig} from 'vite'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'plugins'
const appId = process.env.SANITY_STUDIO_APP_ID || 'bi1ktslqwmu1cawds5ce3jn6'

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId, autoUpdates: true},
  reactStrictMode: true,
  reactCompiler: {target: '19'},
  studioHost: 'plugins',
  vite: async (config, configEnv) => {
    return configEnv.mode === 'development'
      ? mergeConfig(config, {
          resolve: {
            alias: await aliasFromSource(
              '@sanity/debug-preview-url-secret-plugin',
              '@sanity/vercel-protection-bypass',
            ),
          },
        })
      : config
  },
})

async function aliasFromSource(...packageNames: string[]) {
  const aliases: Record<string, string> = {}

  for (const packageName of packageNames) {
    const {default: pkg} = await import(`${packageName}/package.json`, {with: {type: 'json'}})
    const root = path.dirname(require.resolve(`${packageName}/package.json`))

    for (const [key, value] of Object.entries(pkg.exports)) {
      if (
        key === './package.json' ||
        typeof value !== 'object' ||
        !value ||
        !('source' in value) ||
        typeof value.source !== 'string'
      )
        continue
      aliases[path.join(packageName, key)] = path.resolve(root, value.source)
    }
  }
  return aliases
}
