import {ColorWheelIcon} from '@sanity/icons/ColorWheel'
import {Box, Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {lazy, startTransition, Suspense, use, useRef, useTransition, ViewTransition} from 'react'
import {type NavbarProps} from 'sanity'
import type {NavbarAction} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {
  ToolDispatchContext,
  ToolIsOpenContext,
  ToolShouldDetectNavbarHeightContext,
  ToolSplitIsOpenContext,
  usePluginConfig,
} from '#context'

import {addThemerTransitionType} from './addThemerTransitionType'

import {viewTransitionClasses} from './ViewTransitions.css'

const AnimatedColorWheelIcon = lazy(() => import('./AnimatedColorWheelIcon'))

/**
 * The Studio navbar's root, the `Card` that draws its bottom border — its
 * test id is stable and unique to the navbar, unlike its `data-ui` name
 */
const NAVBAR_SELECTOR = '[data-testid="studio-navbar"]'

function ThemerNavbarButton() {
  // What the layout provides: the Studio renders the navbar, so props cannot reach it
  const dispatch = use(ToolDispatchContext)
  const open = use(ToolIsOpenContext)
  const split = use(ToolSplitIsOpenContext)
  const shouldDetectNavbarHeight = use(ToolShouldDetectNavbarHeightContext)
  const {title} = usePluginConfig()
  // What is this button's own
  const [busy, startBusyTransition] = useTransition()
  const iconRef = useRef<{spin: () => void}>(null)

  const handleOpen = () =>
    startBusyTransition(() => {
      if (split) addThemerTransitionType('split-screen:open')
      addThemerTransitionType('open')
      dispatch({type: 'open'})
    })
  const handleClose = () =>
    startBusyTransition(() => {
      if (split) addThemerTransitionType('split-screen:close')
      addThemerTransitionType('close')
      dispatch({type: 'close'})
    })
  const handlePrerender = () =>
    startTransition(() => {
      // We want to trigger rerender in a transition, so that clicking the open button
      // can interrupt a prerender, and hovering over the button won't abort an active view transition.
      // But we also don't want the transition to trigger a view transition,
      // so we intentionally do not set a transition type here.
      dispatch({type: 'prerender'})
      // Do a little fun spin
      if (!open) iconRef.current?.spin()
    })

  // The sidebar's header takes the height of the Studio navbar, so the two
  // line up — whatever height the Studio, its breakpoint or a custom navbar
  // gives it. The button sits inside the navbar, so it is the one to measure
  // it, as a ref callback: observed from mount to unmount, in a transition,
  // since nothing urgent hangs on the number
  const observeNavbarHeight = (root: HTMLButtonElement | null) => {
    const navbar = root?.closest(NAVBAR_SELECTOR)

    if (!navbar) return undefined

    const resizeObserver = new ResizeObserver((entries) => {
      const height = entries[0]?.borderBoxSize[0]?.blockSize

      if (height) {
        startTransition(() => dispatch({type: 'set-navbar-height', height}))
      }
    })

    resizeObserver.observe(navbar)

    return () => resizeObserver.disconnect()
  }

  // The `Box` is here because a `ViewTransition` cannot be the direct child
  // of the `Tooltip`: it needs a child that renders a DOM node
  return (
    <ViewTransition default="none" update={viewTransitionClasses.navbarButtonTooltip.update}>
      <Tooltip animate content={<Text size={1}>{title}</Text>} portal>
        <Box>
          <ViewTransition default="none" update={viewTransitionClasses.navbarButton.update}>
            <Button
              ref={shouldDetectNavbarHeight ? observeNavbarHeight : undefined}
              aria-busy={busy}
              aria-label={title}
              // The wheel itself shows the load, where the `loading` prop would
              // cover it with a spinner
              icon={
                // The animated wheel needs `motion/react`, which is heavy, so it
                // loads lazily — behind the plain icon it reimplements
                <Suspense fallback={<ColorWheelIcon />}>
                  <AnimatedColorWheelIcon busy={busy} ref={iconRef} />
                </Suspense>
              }
              mode="bleed"
              onClick={open ? handleClose : handleOpen}
              onFocus={handlePrerender}
              onMouseEnter={handlePrerender}
              // The Studio's own navbar buttons go through a wrapper that pins them
              // to this padding, where `@sanity/ui` defaults to a roomier 3
              padding={2}
              selected={open || busy}
            />
          </ViewTransition>
        </Box>
      </Tooltip>
    </ViewTransition>
  )
}

export function ThemerNavbar(props: NavbarProps) {
  'use memo'
  const button = {
    location: 'topbar',
    name: 'themer-topbar',
    // The component itself rather than a `() => <ThemerNavbarButton />`
    // wrapper: the Studio renders `render` as a component, and a wrapper
    // made anew on every render would remount the button each time —
    // resetting its animation
    render: ThemerNavbarButton,
  } satisfies NavbarAction
  return props.renderDefault({
    ...props,
    __internal_actions: [...(props.__internal_actions ?? []), button],
  })
}
