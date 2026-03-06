import {ThemeProvider} from '@sanity/ui'
import {useState} from 'react'
import type {LayoutProps} from 'sanity'

import {type Connector, ConnectorsProvider} from '../_lib/connector'
import {AssistConnectorsOverlay} from '../assistConnectors'
import type {AssistPluginConfig} from '../plugin'
import {FieldTranslationProvider} from '../translate/FieldTranslationProvider'
import type {StudioInstruction} from '../types'
import type {RunInstructionRequest} from '../useApiClient'
import {AiAssistanceConfigProvider} from './AiAssistanceConfigProvider'
import {RunInstructionProvider} from './RunInstructionProvider'

export interface AIStudioLayoutProps extends LayoutProps {
  config: AssistPluginConfig
}

export type RunInstructionArgs = Omit<RunInstructionRequest, 'instructionKey' | 'userTexts'> & {
  instruction: StudioInstruction
}

export function AssistLayout(props: AIStudioLayoutProps) {
  const [connectors, setConnectors] = useState<Connector[]>([])

  return (
    <AiAssistanceConfigProvider config={props.config}>
      <RunInstructionProvider>
        <FieldTranslationProvider>
          <ConnectorsProvider onConnectorsChange={setConnectors}>
            {props.renderDefault(props)}
            <ThemeProvider tone="default">
              <AssistConnectorsOverlay connectors={connectors} />
            </ThemeProvider>
          </ConnectorsProvider>
        </FieldTranslationProvider>
      </RunInstructionProvider>
    </AiAssistanceConfigProvider>
  )
}
