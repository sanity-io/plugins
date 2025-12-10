import type {PlopTypes} from '@turbo/gen'

import validateNpmPackageName from 'validate-npm-package-name'

interface NpmPackageJson {
  name: string
  version: string
  description: string
  keywords?: string[]
}

interface NpmPackageData {
  name: string
  versions: Record<string, NpmPackageJson>
}

async function fetchNpmPackage(name: string): Promise<NpmPackageData | null> {
  // For scoped packages like @sanity/foo, npm registry expects @sanity%2Ffoo (only / encoded)
  const encodedName = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : name
  const url = `https://registry.npmjs.org/${encodedName}`
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch npm package: ${response.statusText}`)
  }

  return response.json() as Promise<NpmPackageData>
}

function getSetupInstructions(name: string): string {
  return `
The npm package "${name}" does not exist yet.

First, create the package on npm by running the setup-trusted-publish workflow:

1. Go to https://github.com/sanity-io/plugins/actions/workflows/setup-trusted-publish.yml
2. Click "Run workflow"
3. Enter "${name}" in "The package name"
4. Click "Run workflow" in the popover
5. Wait for the workflow to complete - this creates the initial package on npm

Then, configure trusted publishing so releases can be automated:

6. Open https://www.npmjs.com/package/${name}/access
7. Under "Trusted Publisher", click "GitHub Actions"
8. In "Organization or user", enter: sanity-io
9. In "Repository", enter: plugins
10. In "Workflow filename", enter: release.yml
11. Click "Set up connection"

After completing these steps, run this generator again.
`
}

/**
 * Derives a default export name from a package name.
 *
 * Examples:
 * - sanity-plugin-mux-input → muxInput
 * - @sanity/vercel-bypass-protection → vercelBypassProtection
 * - @sanity/code-input → codeInput
 * - @sanity/personalization-plugin → personalization
 * - @sanity/sanity-plugin-async-list → asyncList
 */
function derivePluginNamedExport(name: string): string {
  let result = name

  // Remove @scope/ prefix if present
  if (result.startsWith('@')) {
    result = result.split('/')[1] || result
  }

  // Remove sanity-plugin- prefix if present
  if (result.startsWith('sanity-plugin-')) {
    result = result.slice('sanity-plugin-'.length)
  }

  // Remove -plugin suffix if present
  if (result.endsWith('-plugin')) {
    result = result.slice(0, -'-plugin'.length)
  }

  // Convert kebab-case to camelCase
  return result.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

function isValidSetupPackage(name: string, packageJson: NpmPackageJson): boolean {
  return (
    packageJson.version === '0.0.1' &&
    packageJson.description === `OIDC trusted publishing setup package for ${name}` &&
    Array.isArray(packageJson.keywords) &&
    packageJson.keywords.length === 3 &&
    packageJson.keywords[0] === 'oidc' &&
    packageJson.keywords[1] === 'trusted-publishing' &&
    packageJson.keywords[2] === 'setup'
  )
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('new plugin', {
    description: 'Generates a new Sanity Studio plugin',
    prompts: async (inquirer) => {
      // Step 1: Get and validate the plugin name
      const {name} = await inquirer.prompt<{name: string}>({
        type: 'input',
        name: 'name',
        message: 'What is the name of the plugin?',
        validate: (input: string) => {
          if (!input) {
            return 'Plugin name is required'
          }
          const {errors} = validateNpmPackageName(input)
          if (errors?.length) {
            return errors.join(', ')
          }
          if (input.startsWith('@') && !input.startsWith('@sanity/')) {
            return 'Only the @sanity scope is allowed'
          }
          return true
        },
      })

      // Step 2: Check npm package existence and validate
      console.log(`\nChecking npm registry for "${name}"...`)

      const npmPackage = await fetchNpmPackage(name)

      if (!npmPackage) {
        // Package doesn't exist - show setup instructions and abort
        console.error(getSetupInstructions(name))
        throw new Error(`Package "${name}" does not exist on npm. See instructions above.`)
      }

      // Package exists - check versions
      const versions = Object.keys(npmPackage.versions)

      if (versions.length === 0) {
        console.error(getSetupInstructions(name))
        throw new Error(`Package "${name}" has no published versions. See instructions above.`)
      }

      if (versions.length > 1 || versions[0] !== '0.0.1') {
        throw new Error(
          `Package "${name}" already has published versions other than 0.0.1 (found: ${versions.join(', ')}).\n` +
            `Use the "copy plugin" command instead to migrate an existing plugin.`,
        )
      }

      // Check if the 0.0.1 package.json matches the setup template
      const setupPackageJson = npmPackage.versions['0.0.1']

      if (!isValidSetupPackage(name, setupPackageJson)) {
        throw new Error(
          `Package "${name}@0.0.1" exists but doesn't match the expected OIDC setup template.\n` +
            `This appears to be a real published package.\n` +
            `Use the "copy plugin" command instead to migrate an existing plugin.`,
        )
      }

      console.log(`✓ Package "${name}" is a valid OIDC setup package. Proceeding...\n`)

      // Step 3: Get description
      const {description} = await inquirer.prompt<{description: string}>({
        type: 'input',
        name: 'description',
        message:
          'What is the description of the plugin?\n  (Used in package.json and README.md intro)',
      })

      // Step 4: Get plugin named export
      const defaultExport = derivePluginNamedExport(name)
      const {pluginNamedExport} = await inquirer.prompt<{pluginNamedExport: string}>({
        type: 'input',
        name: 'pluginNamedExport',
        message: 'What should the plugin export be named?\n  (Used in imports like: import { X } from ...)',
        default: defaultExport,
      })

      // Version starts at 0.0.1 for new plugins (replaces the OIDC setup package)
      return {name, description, pluginNamedExport, version: '0.0.1'}
    },
    actions: [
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/README.md',
        templateFile: 'templates/README.md.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/src/index.ts',
        templateFile: 'templates/src/index.ts.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/src/plugin.tsx',
        templateFile: 'templates/src/plugin.tsx.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/eslint.config.js',
        templateFile: 'templates/eslint.config.js.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/package.config.ts',
        templateFile: 'templates/package.config.ts.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/package.json',
        templateFile: 'templates/package.json.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/tsconfig.json',
        templateFile: 'templates/tsconfig.json',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/tsconfig.build.json',
        templateFile: 'templates/tsconfig.build.json',
      },
    ],
  })
}
