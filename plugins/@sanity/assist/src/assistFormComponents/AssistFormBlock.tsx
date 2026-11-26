import {Box, Flex} from '@sanity/ui'
import {useCallback} from 'react'
import {type BlockProps} from 'sanity'
import {
  PatchEvent,
  useFormCallbacks,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {ErrorWrapper} from '../components/SafeValueInput'
import {AiFieldPresence} from '../presence/AiFieldPresence'
import {useAssistPresence} from '../presence/useAssistPresence'

export function AssistFormBlock(props: BlockProps) {
  const presence = useAssistPresence(props.path, true)
  const {onChange} = useFormCallbacks()
  const key = props.value._key
  const localOnChange = useCallback(
    (patchEvent: PatchEvent) => {
      if (!key) {
        return
      }
      onChange(PatchEvent.from(patchEvent).prefixAll({_key: key}))
    },
    [onChange, key],
  )
  const singlePresence = presence[0]
  return (
    <ErrorWrapper onChange={localOnChange}>
      <Flex align="center" justify="space-between">
        <Box flex={1}>{props.renderDefault(props)}</Box>
        {singlePresence && <AiFieldPresence presence={singlePresence} />}
      </Flex>
    </ErrorWrapper>
  )
}
