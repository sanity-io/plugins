import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'

import type {ThemerProps} from '#types'

import {ScrollArea} from './ScrollArea'
import {displayTitle} from './themes'
import {ThemeThumbnail} from './ThemeThumbnail'

import {removedThumbnail} from './RemovedThemes.css'

/**
 * The flow for restoring removed themes: the presets and custom themes the
 * user took out of the list, each with a button to put it back — and, for
 * custom themes, one to delete it for good. The footer leads back to the
 * list, and the machine leaves the flow on its own once the last theme is
 * gone.
 *
 * @internal
 */
export function RemovedThemes({actorRef, removed}: Pick<ThemerProps, 'actorRef' | 'removed'>) {
  return (
    <>
      <ScrollArea padding={3}>
        <Stack gap={5}>
          {removed.map((theme) => (
            <Stack key={theme.slug} gap={3}>
              <Box className={removedThumbnail}>
                <ThemeThumbnail options={theme.options} />
              </Box>
              <Text align="center" size={1} textOverflow="ellipsis">
                {displayTitle(theme.title)}
              </Text>
              <Flex gap={2} justify="center">
                <Button
                  mode="ghost"
                  onClick={() => actorRef.send({type: 'theme.restore', slug: theme.slug})}
                  padding={2}
                  text="Restore"
                />
                {theme.source === 'custom' && (
                  <Button
                    mode="ghost"
                    onClick={() => actorRef.send({type: 'theme.delete', slug: theme.slug})}
                    padding={2}
                    text="Delete"
                    tone="critical"
                  />
                )}
              </Flex>
            </Stack>
          ))}
        </Stack>
      </ScrollArea>

      {/* In the size of the Studio's own buttons (padding and gap of 2) */}
      <Card borderTop padding={3}>
        <Flex justify="flex-end">
          <Button
            gap={2}
            icon={CheckmarkIcon}
            onClick={() => actorRef.send({type: 'flow.list'})}
            padding={2}
            text="Done"
            mode="ghost"
          />
        </Flex>
      </Card>
    </>
  )
}
