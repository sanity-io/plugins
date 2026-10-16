import type {ViewTransitionClass} from 'react'

import styles from './viewTransitions.module.css'

/**
 * The transition type of the layout's motions — what `ThemerLayout` adds to
 * every transition it starts, and React passes on to the view transition.
 * `:active-view-transition-type()` tells the layout's transitions from any
 * other on the page while they run.
 *
 * It's used on all transition types that userland might want to participate in, for example by setting their own:
 * ```tsx
 * <ViewTransition update={{'sanity-themer': 'auto', default: 'none'}}>
 * ```
 */
export const layoutTransitionType = 'sanity-themer'

/**
 * Used with `addTransitionType`, and on `update` props on `<ViewTransition>`
 * as the object key. Each is a plain identifier under the `sanity-themer`
 * namespace — the stylesheet keys its timings on them
 * (`viewTransitions.module.css`), and userland can tell the motions apart by
 * them the way it does with `sanity-themer`.
 */
export const viewTransitionTypes = {
  'open': 'sanity-themer-open',
  'close': 'sanity-themer-close',
  'split-screen:open': 'sanity-themer-split-screen-open',
  'split-screen:close': 'sanity-themer-split-screen-close',
  'crossfade': 'sanity-themer-crossfade',
} as const

/**
 * The view transition classes of the layout's `ViewTransition` boundaries,
 * picked by transition type — see `viewTransitions.module.css` for what each
 * class does to the snapshots.
 */
export const viewTransitionClasses = {
  navbarButton: {
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.open]: styles.navbarButtonUpdate,
      [viewTransitionTypes.close]: styles.navbarButtonUpdate,
      [viewTransitionTypes.crossfade]: styles.navbarButtonUpdate,
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  navbarButtonTooltip: {
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.open]: 'auto',
      [viewTransitionTypes.close]: 'auto',
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  sidebar: {
    enter: {
      [viewTransitionTypes.open]: styles.panelSlideIn,
      default: 'none',
    },
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes.close]: styles.panelSlideOut,
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  splitscreen: {
    enter: {
      [viewTransitionTypes['split-screen:open']]: styles.splitScreenSlideIn,
      default: 'none',
    },
    update: {
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes['split-screen:close']]: styles.splitScreenSlideOut,
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  studio: {
    update: {
      [viewTransitionTypes.open]: styles.resizeStudio,
      [viewTransitionTypes.close]: styles.resizeStudio,
      [viewTransitionTypes['split-screen:open']]: styles.splitStudio,
      [viewTransitionTypes['split-screen:close']]: styles.splitStudio,
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
}
