import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

// The plugin's tsdown and the copy nested under @sanity/tsdown-config are different
// peer instances, so an inferred export type names UserConfig from a non-portable path.
const config: Promise<UserConfig | UserConfig[]> = defineConfig()

export default config
