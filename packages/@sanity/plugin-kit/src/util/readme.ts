import licenses from '@rexxars/choosealicense-list'
import outdent from 'outdent'

import type {PackageData} from '../actions/inject'
import type {User} from './user'

export function generateReadme(data: PackageData) {
  const {user, pluginName, license} = data

  return (
    outdent`
    # ${pluginName}


    ${installationSnippet(pluginName ?? 'unknown')}

    ## Usage

    Add it as a plugin in \`sanity.config.ts\` (or .js):

    \`\`\`ts
    import {defineConfig} from 'sanity'
    import {myPlugin} from '${pluginName}'

    export default defineConfig({
      //...
      plugins: [myPlugin({})],
    })
    \`\`\`

    ${getLicenseText(license?.id, user?.name ? (user as User) : undefined)}
    ${developTestSnippet()}
  ` + '\n'
  )
}

export function installationSnippet(packageName: string) {
  return outdent`
    ## Installation

    \`\`\`sh
    npm install ${packageName}
    \`\`\`
    `
}

export function developTestSnippet() {
  return outdent`
    ## Develop & test

    This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugins/tree/main/packages/@sanity/plugin-kit)
    with default configuration for build & watch scripts.

    See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugins/tree/main/packages/@sanity/plugin-kit#testing-a-plugin-in-sanity-studio)
    on how to run this plugin with hotreload in the studio.
  `
}

export function getLicenseText(licenseId?: string, user?: User) {
  if (!licenseId) {
    return ''
  }

  const license = licenses.find(licenseId)
  let licenseName: string | undefined = license ? license.title : undefined
  licenseName = licenseName?.replace(/\s+license$/i, '')

  let licenseText = '## License\n'
  if (licenseName && user?.name) {
    licenseText = `${licenseText}\n[${licenseName}](LICENSE) © ${user?.name}\n`
  } else if (licenseName) {
    licenseText = `${licenseText}\n[${licenseName}](LICENSE)\n`
  } else {
    licenseText = `${licenseText}\nSee [LICENSE](LICENSE)`
  }

  return licenseText
}

export function isDefaultGitHubReadme(readme: string) {
  if (!readme) {
    return false
  }

  const lines = readme.split('\n', 20).filter(Boolean)

  // title + _optional_ description
  return lines.length <= 2 && lines[0].startsWith('#')
}
