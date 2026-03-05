import {Card, Flex, Text, Tooltip} from '@sanity/ui'
import type {FormNodePresence} from 'sanity'

import {FadeInContent} from '../components/FadeInContent'
import {AssistAvatar} from './AssistAvatar'

export function AiFieldPresence(_props: {presence: FormNodePresence}) {
  return (
    <Card style={{position: 'relative', background: 'transparent'}} contentEditable={false}>
      <Tooltip
        placement="left"
        content={
          <Card padding={3} border>
            <Flex align="center">
              <Text size={1}>Running instruction...</Text>
            </Flex>
          </Card>
        }
      >
        <FadeInContent durationMs={300}>
          <AssistAvatar state="active" />
        </FadeInContent>
      </Tooltip>
    </Card>
  )
}
