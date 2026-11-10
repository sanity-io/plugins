// oxlint-disable eslint/no-await-in-loop - legacy code will be lint-cleaned in a follow-up PR
import type {InjectOptions} from '../actions/inject'
import {renovatePreset} from './renovatebot'
import {semverWorkflowPreset} from './semver-workflow'
import {ui} from './ui'

export interface Preset {
  name: string
  description: string
  apply: (options: InjectOptions) => Promise<void>
}

const presets: Preset[] = [semverWorkflowPreset, renovatePreset, ui]
const presetNames = presets.map((p) => p?.name)

export function presetHelpList(padStart: number) {
  return presets
    .map((p) => `${''.padStart(padStart)}${p.name.padEnd(20)}${p.description}`)
    .join('\n')
}

export async function injectPresets(options: InjectOptions) {
  if (options.flags.presetOnly && !options.flags.preset?.length) {
    throw new Error('--preset-only, but no --preset [preset-name] was provided.')
  }

  const applyPresets = presetsFromInput(options.flags.preset)
  for (const preset of applyPresets) {
    await preset.apply(options)
  }
}

function presetsFromInput(inputPresets: string[] | undefined): Preset[] {
  if (!inputPresets) {
    return []
  }
  const unknownPresets = inputPresets.filter((p) => !presetNames.includes(p))
  if (unknownPresets.length) {
    throw new Error(
      `Unknown --preset(s): [${unknownPresets.join(', ')}]. Must be one of: [${presetNames.join(
        ', ',
      )}]`,
    )
  }

  return inputPresets
    .filter(onlyUnique)
    .map((presetName) => presets.find((p) => p.name === presetName))
    .filter((p): p is Preset => !!p)
}

function onlyUnique(value: string, index: number, arr: string[]) {
  return arr.indexOf(value) === index
}
