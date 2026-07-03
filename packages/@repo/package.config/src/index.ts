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
  // Generate .d.ts with tsgo (@typescript/native-preview), the same engine oxlint's
  // type-check uses. Requires inferred exported types to be portable (TS2883).
  tsgo: true,
} as const satisfies PkgConfigOptions

export default config
