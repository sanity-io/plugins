import {
  createViewTransition,
  globalStyle,
  keyframes,
  style,
  styleVariants,
  type GlobalStyleRule,
} from '@vanilla-extract/css'
import type {ViewTransitionClass} from 'react'

/**
 * The view transition classes of the split preview — what React puts in
 * `view-transition-class`, which the pseudo-element rules below select on.
 * Scoped identifiers, so nothing else on the page can mean the same.
 */
export const splitTransitionClasses = {
  /** The Studio the user was looking at cross-fades between its two widths */
  resize: createViewTransition('splitResize'),
  /** The Studio and the panel cross-fade to another theme, in place */
  crossfade: createViewTransition('themeCrossfade'),
  /** The split copy slides in from the side, or out to it */
  slideIn: createViewTransition('splitSlideIn'),
  slideOut: createViewTransition('splitSlideOut'),
  /** The split copy drops in from the top, or out to it, where the copies stack */
  dropIn: createViewTransition('splitDropIn'),
  dropOut: createViewTransition('splitDropOut'),
}

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

const slideIn = keyframes({from: {transform: 'translateX(-100%)'}})
const slideOut = keyframes({to: {transform: 'translateX(-100%)'}})
const dropIn = keyframes({from: {transform: 'translateY(-100%)'}})
const dropOut = keyframes({to: {transform: 'translateY(-100%)'}})
const slideInFromEnd = keyframes({from: {transform: 'translateX(100%)'}})
const slideOutToEnd = keyframes({to: {transform: 'translateX(100%)'}})
const flipOut = keyframes({from: {transform: 'rotateY(0deg)'}, to: {transform: 'rotateY(-180deg)'}})
const flipIn = keyframes({from: {transform: 'rotateY(180deg)'}, to: {transform: 'rotateY(0deg)'}})

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

/**
 * Used with <ViewTransition> as object values, setting a view transition class depending on the transition type
 */
//The view transition classes of the panel, which slides in from its edge and out to it
export const panelTransitionClasses = {
  slideIn: createViewTransition('panelSlideIn'),
  slideOut: createViewTransition('panelSlideOut'),
  [viewTransitionTypes.open]: createViewTransitionType(
    {new: {animationName: slideInFromEnd}},
    'panelSlideIn',
  ),
  [viewTransitionTypes.close]: createViewTransitionType(
    {old: {animationName: slideOutToEnd}},
    'panelSlideOut',
  ),
}

export const redOutlines = createViewTransitionType(
  {new: {outline: '2px solid red'}},
  'redOutlines',
)

const navbarButtonUpdateTransition = createViewTransitionType({
  new: {animation: 'none'},
  old: {display: 'none'},
})
const sidebarUpdateTransition = createViewTransitionType({
  new: {animation: 'none'},
  old: {display: 'none'},
})
const sidebarSplitScreenTransition = createViewTransitionType({
  new: {animation: 'none'},
  old: {display: 'none'},
})

const resizeStudioRules = {inlineSize: '100%', blockSize: '100%', objectFit: 'fill'} as const
const resizeStudioTransition = createViewTransitionType(
  {old: resizeStudioRules, new: resizeStudioRules},
  'resizeStudio',
)

const splitScreenFilter = 'blur(12px)'

const animationDuration = '5s'
export const viewTransitionClasses = {
  [viewTransitionTypes.open]: createViewTransitionType({
    new: {animationDuration},
    old: {animationDuration},
  }),
  [viewTransitionTypes.close]: createViewTransitionType({
    new: {animationDuration},
    old: {animationDuration},
  }),
  navbarButton: {
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.open]: navbarButtonUpdateTransition,
      [viewTransitionTypes.close]: navbarButtonUpdateTransition,
      [viewTransitionTypes.crossfade]: navbarButtonUpdateTransition,
      debug: redOutlines,
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  navbarButtonTooltip: {
    update: {
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.open]: 'auto',
      [viewTransitionTypes.close]: 'auto',
      debug: redOutlines,
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
      [viewTransitionTypes['split-screen:open']]: 'none',
      [viewTransitionTypes['split-screen:close']]: 'none',
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes.close]: createViewTransitionType(
        {old: {animationName: slideOutToEnd}},
        'panelSlideOut',
      ),
      debug: redOutlines,
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  splitscreen: {
    enter: {
      [viewTransitionTypes['split-screen:open']]: createViewTransitionType(
        {
          new: {
            animationName: keyframes({
              'from': {transform: 'translateX(-100%)', opacity: 0},
              '25%': {opacity: 0},
            }),
          },
        },
        'slideIn',
      ),
      debug: redOutlines,
      default: 'none',
    },
    update: {
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      [viewTransitionTypes['split-screen:close']]: createViewTransitionType(
        {
          old: {
            animationName: keyframes({
              'to': {transform: 'translateX(-100%)', opacity: 0},
              '75%': {opacity: 0},
            }),
          },
        },
        'slideOut',
      ),
      debug: redOutlines,
      default: 'none',
    },
  } as const satisfies Record<string, ViewTransitionClass>,
  studio: {
    enter: {
      debug: redOutlines,
      default: 'none',
    },
    update: {
      // [viewTransitionTypes.crossfade]: createViewTransitionType(
      //   {
      //     imagePair: {perspective: '1000px', transformStyle: 'preserve-3d'},
      //     group: {animationDuration: '6s !important', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1) !important', animationFillMode: 'both'},
      //     old: {animationName: flipOut, backfaceVisibility: 'hidden', },
      //     new: {animationName: flipIn, backfaceVisibility: 'hidden', }},
      //   'crossfadeStudio',
      // ),
      [viewTransitionTypes['open']]: resizeStudioTransition,
      [viewTransitionTypes['close']]: resizeStudioTransition,
      // [viewTransitionTypes['split-screen:open']]: resizeStudioTransition,
      [viewTransitionTypes['split-screen:open']]: createViewTransitionType({
        old: {
          ...resizeStudioRules,
          // animationName: keyframes({to: {transform: 'translateX(50%) scaleX(2)', opacity: 0}, '50%': {opacity: 0}}),
          animationName: keyframes({to: {opacity: 0, filter: splitScreenFilter}}),
        },
        new: {
          ...resizeStudioRules,
          // animationName: keyframes({from: {transform: 'translateX(-25%) scaleX(0.5)', opacity: 0}, '50%': {opacity: 0}}),
          // animationName: keyframes({from: { opacity: 0}, '50%': {opacity: 0}}),
          animationName: keyframes({from: {opacity: 0, filter: splitScreenFilter}}),
        },
      }),
      // [viewTransitionTypes['split-screen:close']]: resizeStudioTransition,
      [viewTransitionTypes['split-screen:close']]: createViewTransitionType({
        old: {
          ...resizeStudioRules,
          // animationName: keyframes({to: {transform: 'translateX(50%) scaleX(2)', opacity: 0}, '50%': {opacity: 0}}),
          animationName: keyframes({to: {opacity: 0, filter: splitScreenFilter}}),
        },
        new: {
          ...resizeStudioRules,
          // animationName: keyframes({from: {transform: 'translateX(-25%) scaleX(0.5)', opacity: 0}, '50%': {opacity: 0}}),
          // animationName: keyframes({from: { opacity: 0}, '50%': {opacity: 0}}),
          animationName: keyframes({from: {opacity: 0, filter: splitScreenFilter}}),
        },
      }),
      [viewTransitionTypes.crossfade]: 'auto',
      default: 'none',
    },
    exit: {
      // [viewTransitionTypes.close]: createViewTransitionType(
      //   {old: {animationName: slideOutToEnd}},
      //   'panelSlideOut',
      // ),
      debug: redOutlines,
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

/** A copy of the Studio in a color scheme of its own, for `color-scheme` */
export const studioScheme = styleVariants({
  light: {colorScheme: 'light'},
  dark: {colorScheme: 'dark'},
})

globalStyle(
  [
    `::view-transition-old(.${splitTransitionClasses.resize})`,
    `::view-transition-new(.${splitTransitionClasses.resize})`,
  ].join(', '),
  {
    inlineSize: '100%',
    blockSize: '100%',
    objectFit: 'fill',
  },
)

globalStyle(`::view-transition-new(.${splitTransitionClasses.slideIn})`, {animationName: slideIn})
globalStyle(`::view-transition-old(.${splitTransitionClasses.slideOut})`, {
  animationName: slideOut,
})
globalStyle(`::view-transition-new(.${splitTransitionClasses.dropIn})`, {animationName: dropIn})
globalStyle(`::view-transition-old(.${splitTransitionClasses.dropOut})`, {animationName: dropOut})
globalStyle(`::view-transition-new(.${panelTransitionClasses.slideIn})`, {
  animationName: slideInFromEnd,
})
globalStyle(`::view-transition-old(.${panelTransitionClasses.slideOut})`, {
  animationName: slideOutToEnd,
})

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
