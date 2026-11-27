import {PlayIcon} from '@sanity/icons/Play'
import {Button, Dialog, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {
  createContext,
  lazy,
  type PropsWithChildren,
  Suspense,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react'

import type {CustomInputResult, GetUserInput} from '../fieldActions/useUserInput'
import {getInstructionTitle} from '../helpers/misc'
import {type UserInputBlock, userInputTypeName} from '../types'
import {useApiClient, useRunInstructionApi} from '../useApiClient'
import {useAiAssistanceConfig} from './AiAssistanceConfigContext'
import type {RunInstructionArgs} from './AssistLayout'
import type {BlockInputs} from './UserInput'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const UserInput = lazy(() => import('./UserInput'))

const NO_INPUT: BlockInputs = {}

export interface RunInstructionContextValue {
  runInstruction: (req: RunInstructionArgs) => void
  getUserInput: GetUserInput
  instructionLoading: boolean
}

const RunInstructionContext = createContext<RunInstructionContextValue>({
  runInstruction: () => {},
  getUserInput: async () => undefined,
  instructionLoading: false,
})

export function useRunInstruction() {
  return useContext(RunInstructionContext)
}

function isUserInputBlock(block: {_type: string}): block is UserInputBlock {
  return block._type === userInputTypeName
}

export function RunInstructionProvider(props: PropsWithChildren<{}>) {
  const {config} = useAiAssistanceConfig()
  const apiClient = useApiClient(config?.__customApiClient)
  const {runInstruction: runInstructionRequest, loading} = useRunInstructionApi(apiClient)

  const id = useId()

  const [inputs, setInputs] = useState(NO_INPUT)
  const [runRequest, setRunRequest] = useState<
    | (RunInstructionArgs & {userInputBlocks: UserInputBlock[]})
    | {dialogTitle: string; userInputBlocks: UserInputBlock[]}
    | undefined
  >()

  const [resolveUserInput, setResolveUserInput] =
    useState<
      (
        value: CustomInputResult[] | PromiseLike<CustomInputResult[] | undefined> | undefined,
      ) => void
    >()

  const getUserInput: GetUserInput = useCallback(async ({title, inputs}) => {
    const userInputBlocks: UserInputBlock[] = inputs.map((input, i) => ({
      _type: userInputTypeName,
      _key: input.id ?? `${i}`,
      message: input.title,
      description: input.description,
    }))

    if (!userInputBlocks.length) {
      return undefined
    }
    setRunRequest({dialogTitle: title, userInputBlocks})
    return new Promise<CustomInputResult[] | undefined>((resolve) => {
      setResolveUserInput(() => resolve)
    })
  }, [])

  const runInstruction = useCallback(
    (req: RunInstructionArgs) => {
      if (loading) {
        return
      }
      const {instruction, ...request} = req
      const instructionKey = instruction._key
      const userInputBlocks = instruction?.prompt
        ?.flatMap((block) =>
          block._type === 'block' ? block.children.filter(isUserInputBlock) : [block],
        )
        .filter(isUserInputBlock)

      if (!userInputBlocks?.length) {
        void runInstructionRequest({
          ...request,
          instructionKey,
          userTexts: undefined,
        })
        return
      }

      setRunRequest({
        ...req,
        userInputBlocks,
      })
    },
    [runInstructionRequest, loading],
  )

  const close = useCallback(() => {
    setRunRequest(undefined)
    setInputs(NO_INPUT)
    if (resolveUserInput) {
      resolveUserInput(undefined)
    }
    setResolveUserInput(undefined)
  }, [resolveUserInput])

  const runWithInput = useCallback(() => {
    if (runRequest) {
      if ('instruction' in runRequest) {
        const {instruction, userInputBlocks: _, ...request} = runRequest
        void runInstructionRequest({
          ...request,
          instructionKey: instruction._key,
          userTexts: Object.entries(inputs).map(([key, value]) => ({
            blockKey: key,
            userInput: value,
          })),
        })
      } else {
        const userInputs = Object.values(inputs).map((input, i) => {
          const userInputBlock = runRequest.userInputBlocks[i]!
          return {
            input: {
              id: userInputBlock._key,
              title: userInputBlock.message ?? '',
              description: userInputBlock.description,
            },
            result: input,
          }
        })
        resolveUserInput?.(userInputs)
        setResolveUserInput(undefined)
      }
    }
    close()
  }, [close, runInstructionRequest, runRequest, inputs, resolveUserInput])

  const open = !!runRequest

  const runDisabled = useMemo(
    () =>
      (runRequest?.userInputBlocks?.length ?? 0) >
      Object.entries(inputs).filter(([, value]) => !!value).length,
    [runRequest?.userInputBlocks, inputs],
  )

  const runButton = (
    <Button
      text="Run instruction"
      onClick={runWithInput}
      tone="primary"
      icon={PlayIcon}
      style={{width: '100%'}}
      disabled={runDisabled}
    />
  )

  const contextValue: RunInstructionContextValue = useMemo(
    () => ({runInstruction, getUserInput, instructionLoading: loading}),
    [getUserInput, loading, runInstruction],
  )

  return (
    <RunInstructionContext.Provider value={contextValue}>
      {open ? (
        <Dialog
          id={id}
          open={open}
          onClose={close}
          width={1}
          header={
            'dialogTitle' in runRequest
              ? runRequest.dialogTitle
              : getInstructionTitle(runRequest?.instruction)
          }
          footer={
            <Flex justify="space-between" padding={2} flex={1}>
              {runDisabled ? (
                <Tooltip
                  content={
                    <Flex padding={2}>
                      <Text>Unable to run instruction. All fields must have a value.</Text>
                    </Flex>
                  }
                  placement="top"
                >
                  <Flex flex={1}>{runButton}</Flex>
                </Tooltip>
              ) : (
                runButton
              )}
            </Flex>
          }
        >
          <Stack padding={4} gap={2}>
            <Suspense
              fallback={
                <Flex justify="center" padding={4}>
                  <Spinner />
                </Flex>
              }
            >
              {runRequest?.userInputBlocks?.map((block, i) => (
                <UserInput
                  key={block._key}
                  block={block}
                  autoFocus={i === 0}
                  inputs={inputs}
                  setInputs={setInputs}
                />
              ))}
            </Suspense>
          </Stack>
        </Dialog>
      ) : null}
      {props.children}
    </RunInstructionContext.Provider>
  )
}
