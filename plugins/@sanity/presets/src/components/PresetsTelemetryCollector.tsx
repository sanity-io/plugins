import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, type ComponentType} from 'react'
import type {LayoutProps} from 'sanity'

import {PresetsAdded} from '../__telemetry__/presets.telemetry'
import type {PresetResult} from '../types'

interface Props extends LayoutProps {
  presets: PresetResult[][]
}

/**
 * Submit telemetry describing configured presets when Studio workspace renders.
 *
 * The name of each preset is logged, rather than the name of the resulting
 * schema type (which can be changed by user configuration).
 */
export const PresetsTelemetryCollector: ComponentType<Props> = ({presets, ...props}) => {
  const telemetry = useTelemetry()

  useEffect(() => {
    if (presets.length !== 0) {
      const presetNames = [...new Set(presets.flat().map((preset) => preset.name))]
      telemetry.log(PresetsAdded, {presetNames})
    }
  }, [presets, telemetry])

  return props.renderDefault(props)
}
