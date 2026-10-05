import {
  createViewTransition,
  globalStyle,
  keyframes,
  style,
  type GlobalStyleRule,
} from '@vanilla-extract/css'
import type {ViewTransitionClass} from 'react'

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
 * Used with addTransitionType, and on `update` props on <ViewTransition> as the object key
 */
export const viewTransitionTypes = {
  'open': createViewTransition('open'),
  'close': createViewTransition('close'),
  'split-screen:open': createViewTransition('split-screen-open'),
  'split-screen:close': createViewTransition('split-screen-close'),
  'crossfade': createViewTransition('crossfade'),
}

const navbarButtonUpdateTransition = createViewTransitionType({
  new: {animation: 'none'},
  old: {display: 'none'},
})

const resizeStudioRules = {inlineSize: '100%', blockSize: '100%', objectFit: 'fill'} as const
const resizeStudioTransition = createViewTransitionType(
  {old: resizeStudioRules, new: resizeStudioRules},
  'resizeStudio',
)

/**
 * The Studio blurs out of its old width and into its new one as the split copy
 * comes and goes. The blur sits on the image pair that holds both snapshots,
 * not on the snapshots themselves: Safari (WebKit, as of Technology Preview
 * 253) paints a filtered snapshot as raw layer contents, losing the
 * `object-fit` stretch of `resizeStudioRules`, so the Studio scaled wrongly
 * while it resized there. One blur peaking at the cross-over, where the two
 * snapshots meet at half opacity, looks the same as the pair of 12px blurs
 * the snapshots carried before — their visible blur peaked at 6px there too
 */
const splitScreenFilter = 'blur(6px)'
const splitStudioTransition = createViewTransitionType({
  imagePair: {
    animationName: keyframes({'50%': {filter: splitScreenFilter}}),
    // The image pair inherits the group's duration, delay and fill mode from
    // the UA stylesheet, but not its timing function, so without this the
    // blur would run on `ease` while the group runs the layout's curve, and
    // peak off the cross-over; see
    // https://css-tricks.com/almanac/pseudo-selectors/v/view-transition-image-pair/#default-styles
    animationTimingFunction: 'inherit',
  },
  old: {...resizeStudioRules, animationName: keyframes({to: {opacity: 0}})},
  new: {...resizeStudioRules, animationName: keyframes({from: {opacity: 0}})},
})
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
        {new: {animationName: keyframes({from: {transform: 'translateX(100%)'}})}},
        'panelSlideIn',
      ),
      default: 'none',
    },
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes.close]: createViewTransitionType(
        {old: {animationName: keyframes({to: {transform: 'translateX(100%)'}})}},
        'panelSlideOut',
      ),
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  splitscreen: {
    enter: {
      [viewTransitionTypes['split-screen:open']]: createViewTransitionType({
        new: {animationName: splitScreenSlideIn},
      }),
      default: 'none',
    },
    update: {
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes['split-screen:close']]: createViewTransitionType({
        old: {animationName: splitScreenSlideOut},
      }),
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  studio: {
    update: {
      [viewTransitionTypes['open']]: resizeStudioTransition,
      [viewTransitionTypes['close']]: resizeStudioTransition,
      [viewTransitionTypes['split-screen:open']]: splitStudioTransition,
      [viewTransitionTypes['split-screen:close']]: splitStudioTransition,
      [viewTransitionTypes.crossfade]: 'auto',
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

globalStyle(
  [
    `:root:active-view-transition-type(${viewTransitionTypes['split-screen:open']})::view-transition-group(*)`,
    `:root:active-view-transition-type(${viewTransitionTypes['split-screen:close']})::view-transition-group(*)`,
  ].join(','),
  {animationDuration: '480ms'},
)

/** The layout's `Flex` positions the sidebar overlay on small screens */
export const layout = style({
  position: 'relative',
})

/**
 * Disable animations automatically for themer view transitions if the user signals to do so
 */
globalStyle(
  `:root:active-view-transition-type(${layoutTransitionType})::view-transition-group(*),:root:active-view-transition-type(${layoutTransitionType})::view-transition-old(*),:root:active-view-transition-type(${layoutTransitionType})::view-transition-new(*)`,
  {
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        animationDuration: '0s !important',
        animationDelay: '0s !important',
      },
    },
  },
)

/**
 * Allow clicks and interactivity during themer animations
 */
globalStyle(`:root:active-view-transition-type(${layoutTransitionType})::view-transition`, {
  pointerEvents: 'none',
})
