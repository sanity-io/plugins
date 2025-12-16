import {Flex, Spinner} from '@sanity/ui'

export function Loader() {
  return (
    <Flex align="center" justify="center" padding={3}>
      <Spinner muted />
    </Flex>
  )
}
