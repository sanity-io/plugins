import {BoundaryElementProvider, Card, Flex} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import {useActorRef} from '@xstate/react'
import {Activity, lazy, startTransition, useEffect, useState, ViewTransition} from 'react'

import type {PluginConfig} from '#types'
import type {ThemerProps} from '#types'

import {addThemerTransitionType} from './addThemerTransitionType'
import {themerMachine} from './machine'
import {PersistActorSnapshot} from './PersistActorSnapshot'
import type {ToolReducerState} from './reducer'
import {resolveActiveThemeOptions} from './selectors'
import type {readPersistedSnapshot} from './storage'
import {ThemerNavbarProvider} from './ThemerNavbar'

import {layout, viewTransitionClasses} from './ViewTransitions.css'

/**
 * The sidebar — everything in it, from the theme list to the snippet dialog —
 * loads the first time it opens. There is no `Suspense` boundary around it,
 * so it must only ever mount from a deferred render: that keeps the Studio as
 * it was while the code loads, with the navbar toggle showing the deferred
 * value as pending, where an urgent render would suspend up to the Studio's
 * own boundary and swap the whole Studio for its loading screen.
 */
const ResizableSidebar = lazy(() => import('./ResizableSidebar'))

interface ThemerLayoutProps extends Omit<ToolReducerState, 'theme'> {
  children: React.ReactNode
  config: PluginConfig
  dispatch: ThemerProps['dispatch']
  persistedSnapshot: ReturnType<typeof readPersistedSnapshot>
}

/**
 * Wraps the whole Studio so that the theme picked in the themer sidebar
 * applies everywhere while the user browses around, runs the themer machine
 * that the navbar toggle and the sidebar share — the user's themes, which one
 * is applied, which flow the sidebar is in and how the Studio is previewed —
 * and renders the sidebar next to the Studio. The sidebar sits at the
 * `layout` level rather than in `activeToolLayout` because the split preview
 * renders the Studio twice, and the sidebar must not come along.
 *
 * The Studio next to the sidebar always follows the appearance setting
 * (light/dark/system) and the picked theme like any other theme would. The
 * split preview adds a second copy in the opposite scheme on the far side —
 * or on top, on small screens — through React's view transitions (React
 * 19.3), styled in `ThemerLayout.css.ts`.
 *
 * The machine says what shows and when the layout is in motion (its `panel`,
 * `split` and `moving` tags); the layout defers what shows, which puts the
 * panel's and the copy's mounts in a transition — what lets React animate
 * them — and picks the view transition classes from the tags.
 *
 * Whatever else on the page has a `view-transition-name` — an avatar the
 * Studio names so it moves as one piece — comes along in step: every
 * transition the layout starts carries `layoutTransitionType`, which the
 * stylesheet keys on to move every group in the layout's time (see
 * `ThemerLayout.css.ts`).
 *
 * @internal
 */
export function ThemerLayout({
  children,
  backgroundColor,
  config,
  dispatch,
  navbarHeight,
  open,
  persistedSnapshot,
  prerender,
  prerenderSplitScreen,
  scheme,
  split,
}: ThemerLayoutProps & {backgroundColor: string | undefined; scheme: ThemeColorSchemeKey}) {
  const actorRef = useActorRef(themerMachine, {snapshot: persistedSnapshot})
  const oppositeScheme: ThemeColorSchemeKey = scheme === 'dark' ? 'light' : 'dark'
  return (
    <>
      <Flex
        className={layout}
        direction={'row'}
        height="fill"
        sizing="border"
        style={{backgroundColor}}
      >
        {/* Renders the Studio for the second time, in the opposite scheme of the main studio. Hidden by default */}
        <Activity mode={split && open ? 'visible' : 'hidden'}>
          <ViewTransition
            default="none"
            enter={viewTransitionClasses.splitscreen.enter}
            update={viewTransitionClasses.splitscreen.update}
            exit={viewTransitionClasses.splitscreen.exit}
          >
            {prerenderSplitScreen && (
              <StudioPreview
                borderRight
                config={config}
                dispatch={dispatch}
                open={open}
                scheme={oppositeScheme}
                split={split}
              >
                {children}
              </StudioPreview>
            )}
          </ViewTransition>
        </Activity>
        {/* Renders the Studio */}
        <ViewTransition default="none" update={viewTransitionClasses.studio.update}>
          <StudioPreview
            config={config}
            dispatch={dispatch}
            open={open}
            shouldDetectNavbarHeight
            split={split}
          >
            {children}
          </StudioPreview>
        </ViewTransition>
        {/* Renders the Themer tool, hidden by default */}
        <Activity mode={open ? 'visible' : 'hidden'}>
          <ViewTransition
            default="none"
            enter={viewTransitionClasses.sidebar.enter}
            update={viewTransitionClasses.sidebar.update}
            exit={viewTransitionClasses.sidebar.exit}
          >
            {prerender && (
              <ResizableSidebar
                actorRef={actorRef}
                dispatch={dispatch}
                navbarHeight={navbarHeight}
                split={split}
              />
            )}
          </ViewTransition>
        </Activity>
      </Flex>

      <ThemerThemeCrossfader actorRef={actorRef} dispatch={dispatch} />
      <RevokeImageUrls actorRef={actorRef} />
      <PersistActorSnapshot actorRef={actorRef} />
    </>
  )
}

/**
 * One copy of the Studio, in the given color scheme — or, without one, in the
 * scheme the Studio is showing. The configured theme (`null`) goes through
 * the provider too, inheriting the Studio's, so picking a theme swaps it
 * instead of remounting the Studio under a new provider.
 *
 * The two copies of the split preview share the router, the document store
 * and every other provider above the layout — only the scheme differs — so
 * they stay in sync while navigating. The `color-scheme` of a forced scheme
 * keeps native form controls and scrollbars in step with it.
 */
function StudioPreview({
  borderRight,
  children,
  config,
  dispatch,
  open,
  scheme,
  shouldDetectNavbarHeight,
  split,
}: {
  borderRight?: boolean
  scheme?: ThemeColorSchemeKey
} & React.ComponentProps<typeof ThemerNavbarProvider>) {
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)
  return (
    <Card
      borderRight={borderRight}
      flex={1}
      height="fill"
      overflow="hidden"
      scheme={scheme}
      ref={(boundaryElement) => {
        startTransition(() => setBoundaryElement(boundaryElement))
        // Intentionally not unsetting the element as it would create unnecessary work when <Activity> unhides
        return () => {}
      }}
    >
      <BoundaryElementProvider element={boundaryElement}>
        <ThemerNavbarProvider
          config={config}
          dispatch={dispatch}
          open={open}
          shouldDetectNavbarHeight={shouldDetectNavbarHeight}
          split={split}
        >
          <ViewTransition update="none">{children}</ViewTransition>
        </ThemerNavbarProvider>
      </BoundaryElementProvider>
    </Card>
  )
}

function ThemerThemeCrossfader({actorRef, dispatch}: Pick<ThemerProps, 'actorRef' | 'dispatch'>) {
  useEffect(() => {
    const subscription = actorRef.subscribe((snapshot) => {
      const switching = snapshot.hasTag('switching')
      const theme = resolveActiveThemeOptions(snapshot.context)
      startTransition(() => {
        if (switching) {
          addThemerTransitionType('crossfade')
        }
        if (!theme) {
          dispatch({type: 'unset-theme'})
        } else {
          dispatch({type: 'set-theme', theme})
        }
      })
    })
    return () => subscription.unsubscribe()
  }, [actorRef, dispatch])

  return null
}

function RevokeImageUrls({actorRef}: Pick<ThemerProps, 'actorRef'>) {
  // The machine releases the image of a palette as it is replaced or its
  // theme deleted; whatever it still holds goes with the layout — the actor
  // keeps its last snapshot once stopped
  useEffect(
    () => () => {
      for (const url of Object.values(actorRef.getSnapshot().context.images)) {
        URL.revokeObjectURL(url)
      }
    },
    [actorRef],
  )

  return null
}
