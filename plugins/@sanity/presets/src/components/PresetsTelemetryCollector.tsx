import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, type ComponentType} from 'react'
import type {InputProps} from 'sanity'

import {collectPresetsRegistryTelemetry} from '../telemetry'

type Props = InputProps & {
  registryId: string
  userInput?: ComponentType<InputProps>
}

/**
 * A transparent input component wrapper that triggers telemetry collection
 * for the presets registry. Renders the user-provided input component if
 * supplied, otherwise the default input component unchanged.
 *
 * Attached to every schema type produced by a define<Type> function via
 * components.input. The first instance to render for a given registry id
 * submits the PresetsAdded telemetry event; subsequent renders are no-ops.
 */
export const PresetsTelemetryCollector: ComponentType<Props> = ({
  registryId,
  userInput: UserInput,
  ...props
}) => {
  const telemetry = useTelemetry()

  useEffect(() => {
    collectPresetsRegistryTelemetry(registryId, telemetry)
  }, [registryId, telemetry])

  if (UserInput) {
    return <UserInput {...props} />
  }

  return props.renderDefault(props)
}
