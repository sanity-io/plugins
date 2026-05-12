import {
  ArrowLeftIcon,
  CheckmarkCircleIcon,
  CodeIcon,
  ErrorOutlineIcon,
  PlayIcon,
} from '@sanity/icons'
import {Box, Button, Card, Code, Flex, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {type ChangeEvent, useCallback, useState} from 'react'
import {useClient} from 'sanity'
import {useRouter} from 'sanity/router'

import {getScriptByName, scripts} from './registry'
import type {RegisteredStudioScript, ScriptLogLevel, ScriptLogger, ScriptStringInput} from './types'

const DEFAULT_API_VERSION = '2026-03-01'

type RunStatus = 'idle' | 'running' | 'success' | 'error'

interface OutputEntry {
  id: string
  level: ScriptLogLevel
  message: string
  timestamp: string
}

function formatValue(value: unknown): string {
  if (value instanceof Error) {
    return value.stack || value.message
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatMessages(messages: unknown[]): string {
  return messages.map(formatValue).join(' ')
}

function logTone(level: ScriptLogLevel): 'default' | 'positive' | 'caution' | 'critical' {
  if (level === 'success') return 'positive'
  if (level === 'warning') return 'caution'
  if (level === 'error') return 'critical'
  return 'default'
}

function createLogger(
  appendLog: (level: ScriptLogLevel, messages: unknown[]) => void,
): ScriptLogger {
  return {
    info: (...messages) => appendLog('info', messages),
    success: (...messages) => appendLog('success', messages),
    warning: (...messages) => appendLog('warning', messages),
    error: (...messages) => appendLog('error', messages),
  }
}

function getInputValue(input: ScriptStringInput, inputValues: Record<string, string>): string {
  return inputValues[input.name] ?? input.defaultValue ?? ''
}

function hasMissingRequiredInputs(
  inputs: ScriptStringInput[] | undefined,
  inputValues: Record<string, string>,
): boolean {
  return (
    inputs?.some((input) => input.required && getInputValue(input, inputValues).trim() === '') ??
    false
  )
}

function getRunInputValues(
  inputs: ScriptStringInput[] | undefined,
  inputValues: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    (inputs || []).map((input) => [input.name, getInputValue(input, inputValues)]),
  )
}

function ScriptsHome(props: {
  onOpenScript: (scriptName: string) => void
  scripts: RegisteredStudioScript[]
}) {
  const {onOpenScript, scripts: registeredScripts} = props

  return (
    <Box padding={4}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading as="h1" size={3}>
            Scripts
          </Heading>
          <Text muted>
            Run test-studio scripts with the current Studio client and logged-in user.
          </Text>
        </Stack>

        {registeredScripts.length === 0 ? (
          <Card border padding={4} radius={2}>
            <Text muted>No scripts have been registered yet.</Text>
          </Card>
        ) : (
          <Stack space={3}>
            {registeredScripts.map((script) => (
              <Card border key={script.name} padding={4} radius={2}>
                <Flex align="center" gap={4} justify="space-between">
                  <Stack space={3}>
                    <Heading as="h2" size={1}>
                      {script.title}
                    </Heading>
                    <Code size={1}>scripts/{script.name}</Code>
                    {script.description ? <Text muted>{script.description}</Text> : null}
                  </Stack>
                  <Button
                    icon={CodeIcon}
                    mode="ghost"
                    onClick={() => onOpenScript(script.name)}
                    text="Open"
                  />
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

function UnknownScript(props: {onBack: () => void; scriptName: string}) {
  const {onBack, scriptName} = props

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Button icon={ArrowLeftIcon} mode="ghost" onClick={onBack} text="Back to scripts" />
        <Card border padding={4} radius={2} tone="critical">
          <Stack space={3}>
            <Heading as="h1" size={2}>
              Unknown script
            </Heading>
            <Text>
              No script named <Code>{scriptName}</Code> is registered.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Box>
  )
}

function ScriptRunView(props: {
  inputValues: Record<string, string>
  onBack: () => void
  onInputChange: (inputName: string, value: string) => void
  onRun: () => void
  output: OutputEntry[]
  script: RegisteredStudioScript
  status: RunStatus
}) {
  const {inputValues, onBack, onInputChange, onRun, output, script, status} = props
  const isRunning = status === 'running'
  const missingRequiredInputs = hasMissingRequiredInputs(script.inputs, inputValues)

  return (
    <Box padding={4}>
      <Stack space={5}>
        <Button icon={ArrowLeftIcon} mode="ghost" onClick={onBack} text="Back to scripts" />

        <Card border padding={4} radius={2}>
          <Flex align="center" gap={4} justify="space-between">
            <Stack space={3}>
              <Heading as="h1" size={3}>
                {script.title}
              </Heading>
              <Code size={1}>scripts/{script.name}</Code>
              {script.description ? <Text muted>{script.description}</Text> : null}
            </Stack>
            <Button
              disabled={isRunning || missingRequiredInputs}
              icon={status === 'success' ? CheckmarkCircleIcon : PlayIcon}
              loading={isRunning}
              onClick={onRun}
              text={isRunning ? 'Running...' : 'Run script'}
              tone={status === 'error' ? 'critical' : 'primary'}
            />
          </Flex>
        </Card>

        {script.inputs?.length ? (
          <Card border padding={4} radius={2}>
            <Stack space={4}>
              <Heading as="h2" size={1}>
                Variables
              </Heading>
              <Stack space={4}>
                {script.inputs.map((input) => (
                  <Stack key={input.name} space={2}>
                    <Flex align="center" gap={2}>
                      <Text size={1} weight="semibold">
                        {input.title}
                      </Text>
                      {input.required ? (
                        <Text muted size={1}>
                          Required
                        </Text>
                      ) : null}
                    </Flex>
                    <TextInput
                      disabled={isRunning}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        onInputChange(input.name, event.currentTarget.value)
                      }
                      placeholder={input.placeholder}
                      value={getInputValue(input, inputValues)}
                    />
                    {input.description ? (
                      <Text muted size={1}>
                        {input.description}
                      </Text>
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Card>
        ) : null}

        <Stack space={3}>
          <Heading as="h2" size={1}>
            Output
          </Heading>
          {output.length === 0 ? (
            <Card border padding={4} radius={2}>
              <Text muted>Run the script to see output here.</Text>
            </Card>
          ) : (
            <Stack space={2}>
              {output.map((entry) => (
                <Card border key={entry.id} padding={3} radius={2} tone={logTone(entry.level)}>
                  <Stack space={2}>
                    <Flex align="center" gap={2}>
                      {entry.level === 'error' ? <ErrorOutlineIcon /> : null}
                      {entry.level === 'success' ? <CheckmarkCircleIcon /> : null}
                      <Code size={1}>
                        {entry.timestamp} {entry.level}
                      </Code>
                    </Flex>
                    <pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>
                      <code>{entry.message}</code>
                    </pre>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

export default function ScriptRunnerTool(): React.JSX.Element {
  const router = useRouter()
  const scriptName =
    typeof router.state.scriptName === 'string' ? router.state.scriptName : undefined
  const script = getScriptByName(scriptName)
  const client = useClient({apiVersion: script?.apiVersion || DEFAULT_API_VERSION})
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState<OutputEntry[]>([])
  const [status, setStatus] = useState<RunStatus>('idle')

  const appendLog = useCallback((level: ScriptLogLevel, messages: unknown[]) => {
    setOutput((currentOutput) => {
      const now = new Date()

      return [
        ...currentOutput,
        {
          id: `${now.getTime()}-${currentOutput.length}`,
          level,
          message: formatMessages(messages),
          timestamp: now.toLocaleTimeString(),
        },
      ]
    })
  }, [])

  const openHome = useCallback(() => {
    setInputValues({})
    setOutput([])
    setStatus('idle')
    router.navigate({})
  }, [router])

  const openScript = useCallback(
    (nextScriptName: string) => {
      setInputValues({})
      setOutput([])
      setStatus('idle')
      router.navigate({scriptName: nextScriptName})
    },
    [router],
  )

  const handleInputChange = useCallback((inputName: string, value: string) => {
    setInputValues((currentValues) => Object.assign({}, currentValues, {[inputName]: value}))
  }, [])

  const runScript = useCallback(async () => {
    if (!script || status === 'running') {
      return
    }

    const inputs = getRunInputValues(script.inputs, inputValues)
    const controller = new AbortController()
    const log = createLogger(appendLog)

    setOutput([])
    setStatus('running')

    try {
      log.info(`Running "${script.title}"...`)
      await script.run({client, inputs, log, signal: controller.signal})
      log.success('Script completed.')
      setStatus('success')
    } catch (error) {
      log.error('Script failed:', error)
      setStatus('error')
    }
  }, [appendLog, client, inputValues, script, status])

  if (scriptName && !script) {
    return <UnknownScript onBack={openHome} scriptName={scriptName} />
  }

  if (script) {
    return (
      <ScriptRunView
        inputValues={inputValues}
        onBack={openHome}
        onInputChange={handleInputChange}
        onRun={runScript}
        output={output}
        script={script}
        status={status}
      />
    )
  }

  return <ScriptsHome onOpenScript={openScript} scripts={scripts} />
}
