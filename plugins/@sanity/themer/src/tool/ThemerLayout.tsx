import {Card, Flex} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import {useActorRef, useSelector} from '@xstate/react'
import {
  Activity,
  lazy,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import {useColorSchemeValue} from 'sanity'

import {addThemerTransitionType} from './addThemerTransitionType'
import {
  type ThemerProps,
  ToolDispatchContext,
  ToolIsOpenContext,
  ToolSplitIsOpenContext,
  usePluginConfig,
} from './context'
import {selectStoredState, type ThemerInput, themerMachine} from './machine'
import type {ToolReducerState} from './reducer'
import {resolveActiveThemeOptions, sameStoredState, sameView, selectView} from './selectors'
import {type PersistedThemer, writePersistedSnapshot} from './storage'
import {syncThemer} from './sync'
import {resolveThemes} from './themes'
import {useStudioNavbarHeight} from './useStudioNavbarHeight'

import {viewTransitionClasses} from './ViewTransitions.css'

/**
 * The sidebar — everything in it, from the theme list to the snippet dialog —
 * loads the first time it opens. There is no `Suspense` boundary around it,
 * so it must only ever mount from a transition: the navbar toggle prerenders
 * it in one as the pointer comes near, which keeps the Studio as it was while
 * the code loads, where an urgent render would suspend up to the Studio's
 * own boundary and swap the whole Studio for its loading screen.
 */
const ResizableSidebar = lazy(() => import('./ResizableSidebar'))

interface ThemerLayoutProps extends Omit<ToolReducerState, 'theme'> {
  children: React.ReactNode
  dispatch: ThemerProps['dispatch']
  /** What the last session persisted, for the machine to pick up where it left off */
  persisted: PersistedThemer
}

/**
 * Wraps the whole Studio to run the themer machine that the sidebar's flows
 * share — the user's themes, which one is applied and which flow the sidebar
 * is in — and renders the sidebar next to the Studio. The sidebar sits at
 * the `layout` level rather than in `activeToolLayout` because the split
 * preview renders the Studio twice, and the sidebar must not come along.
 *
 * Whether the sidebar is open and whether the Studio shows twice comes in as
 * props from the tool reducer in `plugin.tsx`, and goes on to the sidebar as
 * props along with what the layout selects from the machine (see
 * `ThemerProps`): the navbar toggle and the sidebar dispatch to the reducer
 * inside transitions tagged with a transition type (see
 * `addThemerTransitionType`), and the `ViewTransition` boundaries below pick
 * their classes by that type, so React animates the sidebar sliding in and
 * out, the split copy coming and going and a picked theme cross-fading in
 * (React 19.3), styled in `ViewTransitions.css.ts`. The sidebar and the split
 * copy stay mounted while hidden, in `Activity`, so that opening them again
 * is instant and they can prerender ahead of the transition. The navbar
 * toggle, which the Studio renders somewhere in `children`, reads the same
 * values from the `Tool*Context`s provided here.
 *
 * The applied theme is the reducer's, provided above this layout in
 * `plugin.tsx`: the machine publishes it synchronously, which React does not
 * animate, so `ThemerThemeCrossfader` hands it to the reducer in a
 * transition of its own. The Studio next to the sidebar always follows the
 * appearance setting (light/dark/system) and the picked theme like any other
 * theme would; the split preview adds a second copy in the opposite scheme
 * on the far side.
 *
 * Whatever else on the page has a `view-transition-name` — an avatar the
 * Studio names so it moves as one piece — comes along in step: every
 * transition the layout starts carries `layoutTransitionType`, which the
 * stylesheet keys on to move every group in the layout's time (see
 * `ViewTransitions.css.ts`).
 *
 * @internal
 */
export function ThemerLayout({
  children,
  dispatch,
  open,
  persisted,
  prerender,
  prerenderSplitScreen,
  split,
}: ThemerLayoutProps) {
  const {baseOptions} = usePluginConfig()
  const [input] = useState<ThemerInput>(() => ({baseOptions, stored: persisted.state}))
  const actorRef = useActorRef(themerMachine, {input, snapshot: persisted.snapshot})
  const stored = useSelector(actorRef, selectStoredState, sameStoredState)
  const view = useSelector(actorRef, selectView, sameView)
  const images = useSelector(actorRef, (snapshot) => snapshot.context.images)
  const studioRef = useRef<HTMLDivElement | null>(null)
  const navbarHeight = useStudioNavbarHeight(studioRef)

  const {themes, removed, active} = useMemo(
    () => resolveThemes(stored, baseOptions),
    [stored, baseOptions],
  )

  const scheme = useColorSchemeValue()
  const oppositeScheme: ThemeColorSchemeKey = scheme === 'dark' ? 'light' : 'dark'

  return (
    <>
      <ToolDispatchContext value={dispatch}>
        <ToolIsOpenContext value={open}>
          <ToolSplitIsOpenContext value={split}>
            <Flex height="fill" sizing="border">
              {/* The opposite scheme comes first — on the far side of the sidebar
              — so the Studio the user was looking at stays where it is, mounted,
              in its own scheme. A whole second Studio is costly to mount (its
              styled-components alone insert CSS as they render), so it only
              mounts once the split is about to show — as the pointer reaches the
              split toggle — and then stays, hidden between showings, warmed up
              for the next transition */}
              <Activity mode={split && open ? 'visible' : 'hidden'}>
                <ViewTransition
                  default="none"
                  enter={viewTransitionClasses.splitscreen.enter}
                  update={viewTransitionClasses.splitscreen.update}
                  exit={viewTransitionClasses.splitscreen.exit}
                >
                  {prerenderSplitScreen && (
                    <StudioPreview borderRight scheme={oppositeScheme}>
                      {children}
                    </StudioPreview>
                  )}
                </ViewTransition>
              </Activity>

              {/* The Studio gives way and takes room as the sidebar and the split
              copy come and go, and cross-fades as a theme is picked — the Studio
              updates in transitions of its own all the time, and none of those
              may animate it, so every class defaults to `none` */}
              <ViewTransition
                default="none"
                enter={viewTransitionClasses.studio.enter}
                update={viewTransitionClasses.studio.update}
                exit={viewTransitionClasses.studio.exit}
              >
                <StudioPreview ref={studioRef}>{children}</StudioPreview>
              </ViewTransition>
              <Activity mode={open ? 'visible' : 'hidden'}>
                <ViewTransition
                  default="none"
                  enter={viewTransitionClasses.sidebar.enter}
                  update={viewTransitionClasses.sidebar.update}
                  exit={viewTransitionClasses.sidebar.exit}
                >
                  {prerender && (
                    <ResizableSidebar
                      active={active}
                      actorRef={actorRef}
                      dispatch={dispatch}
                      images={images}
                      navbarHeight={navbarHeight}
                      removed={removed}
                      split={split}
                      themes={themes}
                      view={view}
                    />
                  )}
                </ViewTransition>
              </Activity>
            </Flex>
          </ToolSplitIsOpenContext>
        </ToolIsOpenContext>
      </ToolDispatchContext>
      <ThemerThemeCrossfader actorRef={actorRef} dispatch={dispatch} />
      <RevokeImageUrls actorRef={actorRef} />
      <SyncThemer actorRef={actorRef} />
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
function StudioPreview(props: {
  borderRight?: boolean
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
  scheme?: ThemeColorSchemeKey
}) {
  const {borderRight, children, ref, scheme} = props

  return (
    <Card
      borderRight={borderRight}
      flex={1}
      height="fill"
      overflow="hidden"
      ref={ref}
      scheme={scheme}
    >
      <ViewTransition update="none">{children}</ViewTransition>
    </Card>
  )
}

/**
 * Hands the applied theme to the tool reducer as the machine publishes it —
 * in a transition tagged to cross-fade while the machine says a theme is
 * being switched to, so that editing the applied theme's colors applies live
 * while picking another theme fades the Studio over to it
 */
function ThemerThemeCrossfader({actorRef, dispatch}: Pick<ThemerProps, 'actorRef' | 'dispatch'>) {
  useEffect(() => {
    const subscription = actorRef.subscribe((snapshot) => {
      const switching = snapshot.hasTag('switching')
      const theme = resolveActiveThemeOptions(snapshot.context)

      startTransition(() => {
        if (switching) {
          addThemerTransitionType('crossfade')
        }
        if (theme === null) {
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

/**
 * Keeps the themes in step with the other tabs of the Studio, and persists
 * them from one tab only — see `sync.ts`. Lives here, outside the sidebar's
 * `Activity`, so that it runs while the sidebar is closed too: other tabs
 * change the themes whether this one shows them or not
 */
function SyncThemer({actorRef}: Pick<ThemerProps, 'actorRef'>) {
  useEffect(() => syncThemer(actorRef, {persist: writePersistedSnapshot}), [actorRef])

  return null
}
