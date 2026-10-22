import {CloseIcon} from '@sanity/icons/Close'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {dequal} from 'dequal/lite'
import {Activity, startTransition} from 'react'

import type {ThemerView} from '#context'
import type {ThemerProps} from '#types'

import {addThemerTransitionType} from './addThemerTransitionType'
import type {ThemerSnapshot} from './machine'
import {RemovedThemes} from './RemovedThemes'
import {ThemeEditor} from './ThemeEditor'
import {ThemeList} from './ThemeList'
import {resolveThemes} from './themes'
import {TooltipButton} from './TooltipButton'
import {useIsTooSmallForSplitScreen} from './useIsTooSmallForSplitScreen'

import {title} from './ThemerSidebar.css'

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
  actorRef,
  dispatch,
  navbarHeight,
  split,
}: Pick<ThemerProps, 'actorRef' | 'dispatch' | 'navbarHeight' | 'split'>) {
  const view = useSelector(actorRef, selectView, sameView)
  const isTooSmallForSplitScreen = useIsTooSmallForSplitScreen()

  const {themes, removed, active} = useSelector(
    actorRef,
    (snapshot) => resolveThemes(snapshot.context),
    dequal,
  )

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
            <Box className={title} flex={1}>
              <Text size={1} textOverflow="ellipsis" weight="semibold">
                {VIEW_TITLES[view.name]}
              </Text>
            </Box>
            {/* Packed without gaps, so the title still fits next to them at the
                narrowest sidebar width */}
            <Flex>
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
          <ThemeList actorRef={actorRef} active={active} removed={removed} themes={themes} />
        </Activity>
        {view.name === 'edit' && (
          <ThemeEditor
            actorRef={actorRef}
            focusTitle={view.focusTitle}
            slug={view.slug}
            split={split}
            themes={themes}
          />
        )}
        <Activity key="removed" mode={view.name === 'removed' ? 'visible' : 'hidden'}>
          <RemovedThemes actorRef={actorRef} removed={removed} />
        </Activity>
      </Flex>
    </Card>
  )
}

function selectView(snapshot: ThemerSnapshot): ThemerView {
  const {editing} = snapshot.context

  if (snapshot.matches({flow: 'edit'}) && editing) {
    return {name: 'edit', slug: editing.slug, focusTitle: editing.focusTitle}
  }

  if (snapshot.matches({flow: 'removed'})) {
    return {name: 'removed'}
  }

  return {name: 'list'}
}

function sameView(a: ThemerView, b: ThemerView): boolean {
  if (a.name !== b.name) return false

  return (
    a.name !== 'edit' || b.name !== 'edit' || (a.slug === b.slug && a.focusTitle === b.focusTitle)
  )
}
