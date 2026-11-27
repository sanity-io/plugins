import {BoundaryElementProvider, Card, Flex} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import {
  Activity,
  lazy,
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
  ViewTransition,
} from 'react'

import type {PluginConfig} from '#types'
import type {ThemerProps} from '#types'

import {PersistActorSnapshot} from './PersistActorSnapshot'
import type {ToolReducerState} from './reducer'
import {ThemerNavbarProvider} from './ThemerNavbar'
import {viewTransitionClasses} from './viewTransitions'

import * as styles from './ThemerLayout.module.css'

/**
 * The sidebar — everything in it, from the theme list to the snippet dialog —
 * loads the first time it opens. There is no `Suspense` boundary around it,
 * so it must only ever mount from a transition: the navbar toggle prerenders
 * it in one as the pointer comes near, which keeps the Studio as it was while
 * the code loads, where an urgent render would suspend up to the Studio's
 * own boundary and swap the whole Studio for its loading screen.
 */
const ResizableSidebar = lazy(() => import('./ResizableSidebar'))

interface ThemerLayoutProps extends ToolReducerState, Pick<ThemerProps, 'send' | 'snapshot'> {
  children: React.ReactNode
  config: PluginConfig
  dispatch: ThemerProps['dispatch']
}

/**
 * Wraps the whole Studio with the themer machine that the sidebar's flows
 * share — the user's themes, which one is applied and which flow the sidebar
 * is in — and renders the sidebar next to the Studio. The sidebar sits at
 * the `layout` level rather than in `activeToolLayout` because the split
 * preview renders the Studio twice, and the sidebar must not come along.
 *
 * Whether the sidebar is open and whether the Studio shows twice comes in as
 * props from the tool reducer in `ThemerProvider`, and goes on to the sidebar
 * as props along with the machine's snapshot, which the sidebar resolves its
 * themes and flow from, and what sends the machine events (see `ThemerProps`): the navbar toggle and the sidebar
 * dispatch to the reducer inside transitions tagged with a transition type
 * (see `addThemerTransitionType`), and the `ViewTransition` boundaries below
 * pick their classes by that type, so React animates the sidebar sliding in
 * and out, the split copy coming and going and a picked theme cross-fading
 * in (React 19.3), styled in `viewTransitions.module.css`. The sidebar and the
 * split copy stay mounted while hidden, in `Activity`, so that opening them
 * again is instant and they can prerender ahead of the transition. The
 * navbar toggle, which the Studio renders somewhere in `children`, reads the
 * same values and the plugin's options from the contexts
 * `ThemerNavbarProvider` provides in each copy of the Studio, and measures
 * the Studio navbar for the sidebar's header — in the Studio proper, not in
 * the split copy, which `ToolShouldDetectNavbarHeightContext` tells apart.
 *
 * The applied theme is the machine's, provided above this layout in
 * `ThemerProvider`, which sends every event in a transition — tagged to
 * cross-fade when it switches themes. The Studio next to the sidebar always follows the
 * appearance setting (light/dark/system) and the picked theme like any other
 * theme would; the split preview adds a second copy in the opposite scheme
 * on the far side.
 *
 * Whatever else on the page has a `view-transition-name` — an avatar the
 * Studio names so it moves as one piece — comes along in step: every
 * transition the layout starts carries `layoutTransitionType`, which the
 * stylesheet keys on to move every group in the layout's time (see
 * `viewTransitions.module.css`).
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
  prerender,
  prerenderSplitScreen,
  scheme,
  send,
  snapshot,
  split,
}: ThemerLayoutProps & {backgroundColor: string | undefined; scheme: ThemeColorSchemeKey}) {
  const oppositeScheme: ThemeColorSchemeKey = scheme === 'dark' ? 'light' : 'dark'

  return (
    <>
      <Flex
        className={styles.root}
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
                dispatch={dispatch}
                navbarHeight={navbarHeight}
                send={send}
                snapshot={snapshot}
                split={split}
              />
            )}
          </ViewTransition>
        </Activity>
      </Flex>

      <RevokeImageUrls snapshot={snapshot} />
      <PersistActorSnapshot send={send} snapshot={snapshot} />
    </>
  )
}

/**
 * One copy of the Studio, in the given color scheme — or, without one, in the
 * scheme the Studio is showing. The two copies of the split preview share the
 * router, the document store and every other provider above the layout —
 * only the scheme differs — so they stay in sync while navigating. The
 * `color-scheme` of a forced scheme keeps native form controls and scrollbars
 * in step with it. Each copy provides the navbar toggle it renders with the
 * contexts it reads (see `ThemerNavbarProvider`).
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

function RevokeImageUrls({snapshot}: Pick<ThemerProps, 'snapshot'>) {
  // The machine releases the image of a palette as it is replaced or its
  // theme deleted; whatever it still holds goes with the layout
  const revokeImageUrls = useEffectEvent(() => {
    for (const url of Object.values(snapshot.context.images)) {
      URL.revokeObjectURL(url)
    }
  })
  useEffect(() => () => revokeImageUrls(), [])

  return null
}
