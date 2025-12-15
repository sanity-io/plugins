import {type PkgConfigOptions} from '@sanity/pkg-utils'

const config = {
  extract: {enabled: false},
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'off',
    noCheckTypes: 'error',
    noPackageJsonBrowser: 'error',
    noPackageJsonTypesVersions: 'error',
    preferModuleType: 'error',
    noPublishConfigExports: 'error',
  } satisfies NonNullable<PkgConfigOptions['strictOptions']>,
  dts: 'rolldown',
  tsconfig: 'tsconfig.build.json',
} as const satisfies PkgConfigOptions

export default config
