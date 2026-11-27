import {CloseIcon} from '@sanity/icons/Close'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {Activity, startTransition, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'

import type {ThemerView} from '#context'
import type {ThemerProps} from '#types'

import {addThemerTransitionType} from './addThemerTransitionType'
import {AnimatedSparklesIcon} from './AnimatedSparklesIcon'
import {AGENT_API_VERSION, canGenerateThemes} from './generateTheme'
import type {ThemerSnapshot} from './machine'
import {RemovedThemes} from './RemovedThemes'
import {ThemeEditor} from './ThemeEditor'
import {ThemeList} from './ThemeList'
import {resolveThemes} from './themes'
import {TooltipButton} from './TooltipButton'
import {useIsTooSmallForSplitScreen} from './useIsTooSmallForSplitScreen'

import * as styles from './ThemerSidebar.module.css'

const VIEW_TITLES = {
  list: 'Themer',
  edit: 'Edit theme',
  removed: 'Removed themes',
} as const

/**
 * The themer sidebar: a header with the flow's title, the split preview
 * toggle and the close button, and the flow itself — picking a theme, editing
 * one, or restoring removed ones. Each flow ends in a footer like the
 * Studio's document footer: one primary action, with the rest of its actions
 * behind a menu button, and the way back to the list where the flow is not
 * the list.
 *
 * @internal
 */
export function ThemerSidebar({
  dispatch,
  navbarHeight,
  send,
  snapshot,
  split,
}: Pick<ThemerProps, 'dispatch' | 'navbarHeight' | 'send' | 'snapshot' | 'split'>) {
  const view = viewOf(snapshot)
  const isTooSmallForSplitScreen = useIsTooSmallForSplitScreen()
  const client = useClient({apiVersion: AGENT_API_VERSION})
  // Studios whose client predates Agent Actions have nothing to generate with
  const canGenerate = canGenerateThemes(client)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const sessionRef = useRef<AbortController | null>(null)
  const closeGenerator = () => {
    requestRef.current?.abort()
    setGeneratorOpen(false)
  }
  const inList = view.name === 'list'

  // One session for as long as the list is on screen. Closing the bar aborts
  // the request itself. Leaving the list, or closing the themer, ends the
  // session: the themer only hides this sidebar, and that tears the effect
  // down, so the cleanup aborts the session — and the request linked to it —
  // before a result can apply a theme with no bar left to undo it.
  useEffect(() => {
    const session = new AbortController()

    sessionRef.current = session
    if (!inList) session.abort()

    return () => {
      session.abort()
    }
  }, [inList])

  // Resolved from the persisted state alone, so that the flow and the images
  // changing leave the lists as they were
  const {active: activeSlug, custom, removed: removedSlugs, order} = snapshot.context
  const {themes, removed, active} = resolveThemes({
    active: activeSlug,
    custom,
    removed: removedSlugs,
    order,
  })

  return (
    <Card height="fill">
      <Flex direction="column" height="fill">
        {/* The header sits next to the Studio navbar and takes its height, so
            the two bottom borders line up — whatever height the Studio, its
            breakpoint or a custom navbar gives it */}
        <Card
          borderBottom
          padding={3}
          sizing="border"
          style={navbarHeight === null ? undefined : {height: navbarHeight}}
        >
          <Flex align="center" gap={1} height="fill">
            <Box className={styles.title} flex={1}>
              <Text size={1} textOverflow="ellipsis" weight="semibold">
                {VIEW_TITLES[view.name]}
              </Text>
            </Box>
            {/* Packed without gaps, so the title still fits next to them at the
                narrowest sidebar width */}
            <Flex>
              {canGenerate && view.name === 'list' && (
                <TooltipButton
                  aria-pressed={generatorOpen}
                  data-testid="themer-generate"
                  icon={AnimatedSparklesIcon}
                  mode="bleed"
                  onClick={() => (generatorOpen ? closeGenerator() : setGeneratorOpen(true))}
                  padding={2}
                  selected={generatorOpen}
                  tone="primary"
                  tooltip="Generate a theme from a description, with AI credits"
                />
              )}
              {!isTooSmallForSplitScreen && (
                <TooltipButton
                  aria-pressed={split}
                  icon={SplitVerticalIcon}
                  mode="bleed"
                  onClick={() =>
                    startTransition(() => {
                      const type = split ? 'split-screen:close' : 'split-screen:open'
                      addThemerTransitionType(type)
                      dispatch({type})
                    })
                  }
                  onMouseEnter={() =>
                    startTransition(() => {
                      dispatch({type: 'split-screen:prerender'})
                    })
                  }
                  padding={2}
                  selected={split}
                  tooltip="Show light and dark side by side"
                />
              )}
              <TooltipButton
                icon={CloseIcon}
                mode="bleed"
                onClick={() =>
                  startTransition(() => {
                    if (split) addThemerTransitionType('split-screen:close')
                    addThemerTransitionType('close')
                    dispatch({type: 'close'})
                  })
                }
                padding={2}
                tooltip="Close themer"
              />
            </Flex>
          </Flex>
        </Card>

        <Activity key="list" mode={view.name === 'list' ? 'visible' : 'hidden'}>
          <ThemeList
            send={send}
            active={active}
            dialog={dialogOf(snapshot)}
            generator={
              canGenerate && generatorOpen
                ? {client, onClose: closeGenerator, requestRef, sessionRef}
                : null
            }
            removed={removed}
            themes={themes}
          />
        </Activity>
        {view.name === 'edit' && (
          <ThemeEditor
            send={send}
            imageUrl={snapshot.context.images[view.slug]}
            focusTitle={view.focusTitle}
            slug={view.slug}
            split={split}
            themes={themes}
          />
        )}
        <Activity key="removed" mode={view.name === 'removed' ? 'visible' : 'hidden'}>
          <RemovedThemes send={send} removed={removed} />
        </Activity>
      </Flex>
    </Card>
  )
}

function viewOf(snapshot: ThemerSnapshot): ThemerView {
  const {editing} = snapshot.context

  if (snapshot.matches('edit') && editing) {
    return {name: 'edit', slug: editing.slug, focusTitle: editing.focusTitle}
  }

  if (snapshot.matches('removed')) {
    return {name: 'removed'}
  }

  return {name: 'list'}
}

/** The dialog the list has open, if any — a state of the machine's list */
function dialogOf(snapshot: ThemerSnapshot): 'paste' | 'snippet' | null {
  if (snapshot.matches({list: 'pasting'})) return 'paste'
  if (snapshot.matches({list: 'snippet'})) return 'snippet'

  return null
}
