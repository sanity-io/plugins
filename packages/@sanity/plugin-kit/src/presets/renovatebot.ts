import {type InjectOptions, writeAssets} from '../actions/inject'
import type {Preset} from './presets'

export const renovatePreset: Preset = {
  name: 'renovatebot',
  description: 'Files to enable renovatebot.',
  apply: applyPreset,
}

async function applyPreset(options: InjectOptions) {
  await writeAssets(
    [
      {
        type: 'copy',
        from: ['renovatebot', 'renovate.json'],
        to: 'renovate.json',
      },
    ],
    options,
  )
}
