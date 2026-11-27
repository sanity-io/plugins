import {dequal} from 'dequal/lite'
import {createMachine, type EventFrom, type SnapshotFrom, transition, types} from 'xstate'

import type {BuildThemeOptions} from '../theme/options'
import type {ImagePalette} from './imagePalette'
import {resolveActiveThemeOptions} from './selectors'
import {
  CONFIG_SLUG,
  CONFIG_TITLE,
  createCustomTheme,
  duplicateTitle,
  initialThemerState,
  resolveThemes,
  type ThemerState,
  UNTITLED_THEME,
} from './themes'

/** @internal */
export interface ThemerMachineContext extends ThemerState {
  /** The theme open in the editor, while the machine is in `edit` */
  editing: {
    slug: string
    /** Whether the title input should take focus, for themes that were just created */
    focusTitle: boolean
  } | null
  /**
   * Object URLs of the images that themes took their palette from, by theme
   * slug — kept for the session only, so the image can be shown right after
   * it was picked
   */
  images: Record<string, string>
}

interface ThemeChanges {
  title?: string
  options?: BuildThemeOptions
  palette?: ImagePalette
  imageUrl?: string
}

function revokeObjectUrl(url: string) {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

function isCustomTheme(context: ThemerMachineContext, slug: string | undefined) {
  return resolveThemes(context).themes.some(
    (theme) => theme.slug === slug && theme.source === 'custom',
  )
}

function hasRemovedThemes(context: ThemerMachineContext) {
  return resolveThemes(context).removed.length > 0
}

/**
 * The themes of the themer tool and the sidebar's way through them: picking
 * a theme from the `list`, with its dialogs for pasting a shared code and for
 * the applied theme's snippet, `edit`ing one of the user's own themes, or
 * restoring `removed` ones. The context carries the persisted state (the
 * applied theme, the user's themes and what was removed) alongside what the
 * flows need. Whether the sidebar is open and whether the Studio shows twice
 * is not the machine's: the tool reducer in `ThemerProvider` owns that, so
 * that the navbar toggle and the sidebar can change it in transitions of
 * their own. Nor is persisting: the machine never touches storage and takes
 * no input — it starts from no themes, and a session with something to pick
 * up from restores its persisted snapshot instead (see `storage.ts` and
 * `sync.ts`), while the persisted state of other tabs reaches it as a
 * `themes.sync` event like any other.
 *
 * Theme operations are handled in every state, and the states leave on their
 * own when they lose their subject: the editor when its theme is removed or
 * deleted, and the removed view when its last theme is restored or deleted.
 *
 * @internal
 */
export const themerMachine = createMachine({
  id: 'themer',
  schemas: {
    context: types<ThemerMachineContext>(),
    events: {
      /** Applies a theme to the whole Studio */
      'theme.pick': types<{slug: string}>(),
      /**
       * Adds a theme and opens it in the editor — based on the applied theme, or
       * on the given title, options and image palette (e.g. from an image)
       */
      'theme.add': types<ThemeChanges>(),
      /** Adds a copy of a theme and opens it in the editor */
      'theme.duplicate': types<{slug: string}>(),
      /**
       * Adds a theme someone shared as a code, and applies it — staying in the
       * list. A sender that needs to know the theme's slug gives it one.
       */
      'theme.import': types<{title: string; options: BuildThemeOptions; slug?: string}>(),
      /** Opens one of the user's own themes in the editor */
      'theme.edit': types<{slug: string}>(),
      'theme.update': types<ThemeChanges & {slug: string}>(),
      /** Takes a theme out of the list — it can be restored until it is deleted */
      'theme.remove': types<{slug: string}>(),
      /** Puts a removed theme back in the list */
      'theme.restore': types<{slug: string}>(),
      /** Deletes one of the user's own themes for good */
      'theme.delete': types<{slug: string}>(),
      /** Rearranges the list: the slugs of the listed themes, in their new order */
      'theme.reorder': types<{order: string[]}>(),
      /** Back to picking a theme */
      'flow.list': types<{}>(),
      /** On to restoring removed themes */
      'flow.removed': types<{}>(),
      /** Opens the dialog for adding a shared theme code by hand, from the list */
      'dialog.paste': types<{}>(),
      /** Opens the dialog with the applied theme's `buildTheme` snippet, from the list */
      'dialog.snippet': types<{}>(),
      /** Closes whichever dialog is open */
      'dialog.close': types<{}>(),
      /**
       * Takes over the persisted state as another tab of the same Studio changed
       * it, so that every tab shows the same themes (see `sync.ts`). The images
       * of this session stay, they are this tab's
       */
      'themes.sync': types<{state: ThemerState}>(),
    },
  },
  context: () => ({...initialThemerState, editing: null, images: {}}),
  initial: 'list',
  on: {
    'theme.pick': ({event}) => ({
      context: {active: event.slug === CONFIG_SLUG ? null : event.slug},
    }),
    'theme.add': ({context, event}) => {
      // Based on the applied theme — the stock one when the configured theme
      // applies, which is not in the list
      const theme = createCustomTheme(
        event.title ?? UNTITLED_THEME,
        event.options ?? resolveThemes(context).active?.options ?? {},
        event.palette,
      )

      return {
        target: '#themer.edit',
        context: {
          active: theme.slug,
          custom: [...context.custom, theme],
          // A theme named after its image needs no renaming right away
          editing: {slug: theme.slug, focusTitle: event.title === undefined},
          images: event.imageUrl
            ? {...context.images, [theme.slug]: event.imageUrl}
            : context.images,
        },
      }
    },
    'theme.duplicate': ({context, event}) => {
      const {themes, removed} = resolveThemes(context)
      // The configured theme is not in the list: a copy of it starts from the
      // stock options, as the Studio shows it
      const source =
        event.slug === CONFIG_SLUG
          ? {title: CONFIG_TITLE, options: {}, palette: undefined}
          : [...themes, ...removed].find((theme) => theme.slug === event.slug)

      // Nothing to copy leaves nothing to edit
      if (!source) return {target: '#themer.list'}

      const theme = createCustomTheme(duplicateTitle(source.title), source.options, source.palette)

      return {
        target: '#themer.edit',
        context: {
          active: theme.slug,
          custom: [...context.custom, theme],
          editing: {slug: theme.slug, focusTitle: true},
        },
      }
    },
    'theme.import': ({context, event}) => {
      const theme = createCustomTheme(event.title, event.options, undefined, event.slug)

      return {context: {active: theme.slug, custom: [...context.custom, theme]}}
    },
    'theme.edit': ({context, event}) => {
      if (!isCustomTheme(context, event.slug)) return undefined

      return {
        target: '#themer.edit',
        context: {active: event.slug, editing: {slug: event.slug, focusTitle: false}},
      }
    },
    'theme.update': ({context, event}, enq) => {
      const listed = context.custom.some((theme) => theme.slug === event.slug)
      // A new image replaces the one the theme had
      const replaced = event.imageUrl ? context.images[event.slug] : undefined
      if (replaced) enq(() => revokeObjectUrl(replaced))

      return {
        context: {
          custom: context.custom.map((theme) => {
            if (theme.slug !== event.slug) return theme

            // Keep the options identity when only the title changes, so the
            // applied theme is not rebuilt on every keystroke
            return {
              ...theme,
              title: event.title ?? theme.title,
              options: event.options ?? theme.options,
              ...(event.palette ? {palette: event.palette} : {}),
            }
          }),
          images:
            event.imageUrl && listed
              ? {...context.images, [event.slug]: event.imageUrl}
              : context.images,
        },
      }
    },
    'theme.remove': ({context, event}) => {
      if (event.slug === CONFIG_SLUG || context.removed.includes(event.slug)) return {}

      return {
        context: {
          active: context.active === event.slug ? null : context.active,
          removed: [...context.removed, event.slug],
        },
      }
    },
    'theme.restore': ({context, event}) => ({
      context: {removed: context.removed.filter((slug) => slug !== event.slug)},
    }),
    'theme.delete': ({context, event}, enq) => {
      // The image of a deleted theme is released from memory
      const image = context.images[event.slug]
      if (image) enq(() => revokeObjectUrl(image))

      if (!context.custom.some((theme) => theme.slug === event.slug)) return {}

      const {[event.slug]: _deleted, ...images} = context.images

      return {
        context: {
          active: context.active === event.slug ? null : context.active,
          custom: context.custom.filter((theme) => theme.slug !== event.slug),
          removed: context.removed.filter((slug) => slug !== event.slug),
          images,
        },
      }
    },
    'theme.reorder': ({context, event}) => {
      const listed = new Set(resolveThemes(context).themes.map((theme) => theme.slug))
      const order = event.order.filter((slug) => listed.has(slug))

      // The removed themes keep their place in line for when they are restored
      return {
        context: {order: [...order, ...context.order.filter((slug) => !order.includes(slug))]},
      }
    },
    'themes.sync': ({event}) => ({
      context: {
        active: event.state.active,
        custom: event.state.custom,
        removed: event.state.removed,
        order: event.state.order,
      },
    }),
    'flow.list': {target: '#themer.list'},
    'flow.removed': ({context}) =>
      hasRemovedThemes(context) ? {target: '#themer.removed'} : undefined,
  },
  states: {
    list: {
      initial: 'idle',
      // The list's dialogs — for a shared code pasted by hand, and for the
      // applied theme's snippet — are states of the list, so that leaving it,
      // as adding a theme does for the editor, closes them
      states: {
        idle: {
          on: {
            'dialog.paste': {target: 'pasting'},
            // The configured theme has no code to show — it is the Studio's own
            'dialog.snippet': ({context}) =>
              resolveThemes(context).active ? {target: 'snippet'} : undefined,
          },
        },
        pasting: {
          on: {'dialog.close': {target: 'idle'}},
        },
        snippet: {
          on: {'dialog.close': {target: 'idle'}},
          // The applied theme can go away meanwhile — removed from another tab
          always: ({context}) => (resolveThemes(context).active ? undefined : {target: 'idle'}),
        },
      },
    },
    edit: {
      exit: () => ({context: {editing: null}}),
      // The theme being edited can go away — removed from the editor, or
      // duplicated from a theme that does not exist — and then there is
      // nothing left to edit
      always: ({context}) =>
        isCustomTheme(context, context.editing?.slug) ? undefined : {target: 'list'},
    },
    removed: {
      always: ({context}) => (hasRemovedThemes(context) ? undefined : {target: 'list'}),
    },
  },
})

/** @internal */
export type ThemerSnapshot = SnapshotFrom<typeof themerMachine>

/** @internal */
export type ThemerEvent = EventFrom<typeof themerMachine>

/** The part of the machine context that is persisted between sessions @internal */
export function selectStoredState(snapshot: ThemerSnapshot): ThemerState {
  const {active, custom, removed, order} = snapshot.context

  return {active, custom, removed, order}
}

/**
 * Whether an event applies another theme that looks different from the
 * applied one — picking one, adding one from an image, importing one,
 * editing another, removing or deleting the applied one, or another tab
 * applying another — which is when the layout cross-fades the Studio to it.
 * Edits to the applied theme's colors are not switches, they follow the
 * pointer; nor is applying a copy that looks the same. Previews the event on
 * the snapshot, without running its effects.
 *
 * @internal
 */
export function switchesTheme(snapshot: ThemerSnapshot, event: ThemerEvent): boolean {
  const [next] = transition(themerMachine, snapshot, event)

  return (
    next.context.active !== snapshot.context.active &&
    !dequal(resolveActiveThemeOptions(snapshot.context), resolveActiveThemeOptions(next.context))
  )
}
