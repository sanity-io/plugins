import {defineEvent} from '@sanity/telemetry'

interface PresetsAddedInfo {
  presetNames: string[]
}

export const PresetsAdded = defineEvent<PresetsAddedInfo>({
  name: 'Presets Added',
  version: 1,
  description: 'Workspace using presets was accessed',
})
