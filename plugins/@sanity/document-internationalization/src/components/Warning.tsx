import {Card, Flex, Text} from '@sanity/ui'
import type {PropsWithChildren} from 'react'

import ConstrainedBox from './ConstrainedBox'

/**
 * Presentational component that renders a caution-toned card with centered
 * text inside a constrained-width box. Used to display warning messages
 * in the internationalization UI.
 */
export default function Warning({children}: PropsWithChildren) {
  return (
    <Card tone="caution" padding={3}>
      <Flex justify="center">
        <ConstrainedBox>
          <Text size={1} align="center">
            {children}
          </Text>
        </ConstrainedBox>
      </Flex>
    </Card>
  )
}
