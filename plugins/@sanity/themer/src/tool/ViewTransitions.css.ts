import {
  createViewTransition,
  globalStyle,
  keyframes,
  style,
  type GlobalStyleRule,
} from '@vanilla-extract/css'
import type {ViewTransitionClass} from 'react'

/**
 * A view transition class — what React puts in `view-transition-class` —
 * with pseudo-element rules of its own. Scoped identifiers, so nothing else
 * on the page can mean the same.
 */
function createViewTransitionType(
  rules: Partial<Record<'new' | 'old' | 'group' | 'imagePair', GlobalStyleRule>>,
  debugId?: string,
) {
  const type = style({}, debugId)
  if (rules.new) {
    globalStyle(`::view-transition-new(.${type})`, rules.new)
  }
  if (rules.old) {
    globalStyle(`::view-transition-old(.${type})`, rules.old)
  }
  if (rules.group) {
    globalStyle(`::view-transition-group(.${type})`, rules.group)
  }
  if (rules.imagePair) {
    globalStyle(`::view-transition-image-pair(.${type})`, rules.imagePair)
  }
  return type
}

const slideInFromEnd = keyframes({from: {transform: 'translateX(100%)'}})
const slideOutToEnd = keyframes({to: {transform: 'translateX(100%)'}})

/**
 * The transition type of the layout's motions — what `addThemerTransitionType`
 * adds to every transition the themer starts, and React passes on to the view
 * transition. `:active-view-transition-type()` tells the layout's transitions
 * from any other on the page while they run.
 *
 * It's used on all transition types that userland might want to participate in, for example by setting their own:
 * ```tsx
 * <ViewTransition update={{'sanity-themer': 'auto', default: 'none'}}>
 * ```
 */
export const layoutTransitionType = 'sanity-themer'

/**
 * Used with addTransitionType, and on `update` props on <ViewTransition> as the object key
 */
export const viewTransitionTypes = {
  'open': createViewTransition('open'),
  'close': createViewTransition('close'),
  'split-screen:open': createViewTransition('split-screen-open'),
  'split-screen:close': createViewTransition('split-screen-close'),
  'crossfade': createViewTransition('crossfade'),
}

/**
 * The navbar toggle and the sidebar update along with the layout's motions —
 * the toggle's pressed state, the sidebar's split toggle — but must not
 * cross-fade on their own: the new state shows at once, the old one not at all
 */
const navbarButtonUpdateTransition = createViewTransitionType({
  new: {animation: 'none'},
  old: {display: 'none'},
})
const sidebarUpdateTransition = createViewTransitionType({
  new: {animation: 'none'},
  old: {display: 'none'},
})

/**
 * The Studio gives way and takes room as the sidebar and the split copy come
 * and go: its snapshots stretch to the group's size, so it resizes instead of
 * cross-fading between its two widths
 */
const resizeStudioRules = {inlineSize: '100%', blockSize: '100%', objectFit: 'fill'} as const
const resizeStudioTransition = createViewTransitionType(
  {old: resizeStudioRules, new: resizeStudioRules},
  'resizeStudio',
)

/**
 * The Studio blurs out of its old width and into its new one as the split
 * copy comes and goes — the snapshots differ too much for the plain resize to
 * look right, and the copy's slide takes the eye meanwhile
 */
const splitScreenFilter = 'blur(12px)'
const splitStudioTransition = createViewTransitionType(
  {
    old: {
      ...resizeStudioRules,
      animationName: keyframes({to: {opacity: 0, filter: splitScreenFilter}}),
    },
    new: {
      ...resizeStudioRules,
      animationName: keyframes({from: {opacity: 0, filter: splitScreenFilter}}),
    },
  },
  'splitStudio',
)

/**
 * The split copy slides in from the side, or out to it — hidden for the first
 * quarter of the way in, and for the last quarter of the way out
 */
const splitScreenSlideIn = keyframes({
  'from': {transform: 'translateX(-100%)', opacity: 0},
  '25%': {opacity: 0},
})
const splitScreenSlideOut = keyframes({
  'to': {transform: 'translateX(-100%)', opacity: 0},
  '75%': {opacity: 0},
})

/**
 * Used with <ViewTransition> as object values, setting a view transition class depending on the transition type
 */
export const viewTransitionClasses = {
  navbarButton: {
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.open]: navbarButtonUpdateTransition,
      [viewTransitionTypes.close]: navbarButtonUpdateTransition,
      [viewTransitionTypes.crossfade]: navbarButtonUpdateTransition,
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
      [viewTransitionTypes.open]: createViewTransitionType(
        {new: {animationName: slideInFromEnd}},
        'panelSlideIn',
      ),
      default: 'none',
    },
    update: {
      [viewTransitionTypes['split-screen:open']]: sidebarUpdateTransition,
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes.close]: createViewTransitionType(
        {old: {animationName: slideOutToEnd}},
        'panelSlideOut',
      ),
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  splitscreen: {
    enter: {
      [viewTransitionTypes['split-screen:open']]: createViewTransitionType(
        {new: {animationName: splitScreenSlideIn}},
        'slideIn',
      ),
      default: 'none',
    },
    update: {
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes['split-screen:close']]: createViewTransitionType(
        {old: {animationName: splitScreenSlideOut}},
        'slideOut',
      ),
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  studio: {
    enter: {
      default: 'none',
    },
    update: {
      [viewTransitionTypes['open']]: resizeStudioTransition,
      [viewTransitionTypes['close']]: resizeStudioTransition,
      [viewTransitionTypes['split-screen:open']]: splitStudioTransition,
      [viewTransitionTypes['split-screen:close']]: splitStudioTransition,
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
}

/**
 * Default animation timings for all Themer view transitions
 */
globalStyle(
  `:root:active-view-transition-type(${layoutTransitionType})::view-transition-group(*)`,
  {animationDuration: '320ms', animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)'},
)

/**
 * The split copy has the whole Studio's width to cross, so its motions get
 * more time than the others
 */
globalStyle(
  [
    `:root:active-view-transition-type(${viewTransitionTypes['split-screen:open']})::view-transition-group(*)`,
    `:root:active-view-transition-type(${viewTransitionTypes['split-screen:close']})::view-transition-group(*)`,
  ].join(','),
  {animationDuration: '480ms'},
)

/**
 * Disable animations automatically for themer view transitions if the user signals to do so
 */
globalStyle(
  `:root:active-view-transition-type(${layoutTransitionType})::view-transition-group(*),:root:active-view-transition-type(${layoutTransitionType})::view-transition-old(*),:root:active-view-transition-type(${layoutTransitionType})::view-transition-new(*)`,
  {
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        animation: 'none !important',
      },
    },
  },
)
