import {Stack, TextArea} from '@sanity/ui'
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {FormFieldHeaderText} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2'

import type {UserInputBlock} from '../types'

export type BlockInputs = Record<string, string>

export default function UserInput(props: {
  block: UserInputBlock
  inputs: BlockInputs
  setInputs: Dispatch<SetStateAction<BlockInputs>>
  autoFocus?: boolean
}) {
  const {block, autoFocus, setInputs, inputs} = props
  const key = block._key
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const onChange = useCallback(
    // oxlint-disable-next-line no-deprecated
    (e: FormEvent<HTMLTextAreaElement>) => {
      setInputs((current) => ({
        ...current,
        [key]: (e.currentTarget ?? e.target).value,
      }))
    },
    [key, setInputs],
  )

  const value = useMemo(() => inputs[key], [inputs, key])

  useEffect(() => {
    if (!autoFocus) {
      return
    }
    setTimeout(() => textAreaRef.current?.focus(), 0)
  }, [autoFocus])

  return (
    <Stack padding={2} gap={3}>
      <FormFieldHeaderText
        title={block?.message ?? 'Provide more context'}
        description={block.description}
      />
      <TextArea
        ref={textAreaRef}
        rows={4}
        value={value}
        onChange={onChange}
        style={{resize: 'vertical'}}
      />
    </Stack>
  )
}
