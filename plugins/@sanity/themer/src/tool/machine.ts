import {assign, not, setup, type SnapshotFrom} from 'xstate'

import type {BuildThemeOptions} from '../theme/options'
import type {ImagePalette} from './imagePalette'
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

/**
 * How long the machine stays `switching` after an event that applies another
 * theme, when no edit to the applied theme ends it sooner. The layout
 * cross-fades the Studio to the theme in the commit that follows the switch,
 * so this only bounds how long the tag lingers once that is done. Generous,
 * so that it never runs out before a slow deferred commit starts the fade.
 *
 * @internal
 */
export const MOTION_DURATION = 2000

/** @internal */
export interface ThemerMachineContext extends ThemerState {
  /** The theme open in the editor, while the `flow` is `edit` */
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

/** @internal */
export type ThemerEvent =
  /** Applies a theme to the whole Studio */
  | {type: 'theme.pick'; slug: string}
  /**
   * Adds a theme and opens it in the editor — based on the applied theme, or
   * on the given title, options and image palette (e.g. from an image)
   */
  | {
      type: 'theme.add'
      title?: string
      options?: BuildThemeOptions
      palette?: ImagePalette
      imageUrl?: string
    }
  /** Adds a copy of a theme and opens it in the editor */
  | {type: 'theme.duplicate'; slug: string}
  /** Adds a theme someone shared as a code, and applies it — staying in the list */
  | {type: 'theme.import'; title: string; options: BuildThemeOptions}
  /** Opens one of the user's own themes in the editor */
  | {type: 'theme.edit'; slug: string}
  | {
      type: 'theme.update'
      slug: string
      title?: string
      options?: BuildThemeOptions
      palette?: ImagePalette
      imageUrl?: string
    }
  /** Takes a theme out of the list — it can be restored until it is deleted */
  | {type: 'theme.remove'; slug: string}
  /** Puts a removed theme back in the list */
  | {type: 'theme.restore'; slug: string}
  /** Deletes one of the user's own themes for good */
  | {type: 'theme.delete'; slug: string}
  /** Rearranges the list: the slugs of the listed themes, in their new order */
  | {type: 'theme.reorder'; order: string[]}
  /** Back to picking a theme */
  | {type: 'flow.list'}
  /** On to restoring removed themes */
  | {type: 'flow.removed'}
  /** Opens the dialog for adding a shared theme code by hand, from the list */
  | {type: 'dialog.paste'}
  /** Opens the dialog with the applied theme's `buildTheme` snippet, from the list */
  | {type: 'dialog.snippet'}
  /** Closes whichever dialog is open */
  | {type: 'dialog.close'}
  /**
   * Takes over the persisted state as another tab of the same Studio changed
   * it, so that every tab shows the same themes (see `sync.ts`)
   */
  | {type: 'themes.sync'; state: ThemerState}

function themesOf(context: ThemerMachineContext) {
  return resolveThemes(context)
}

function revokeObjectUrl(url: string) {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

/**
 * The themes of the themer tool and the sidebar's way through them: which
 * `flow` the sidebar is in — picking a theme from the `list`, with its
 * dialogs for pasting a shared code and for the applied theme's snippet,
 * `edit`ing one of the user's own themes, or restoring `removed` ones — and,
 * in a parallel `theme` region, whether another theme was just applied. The
 * context carries the persisted state (the applied theme, the user's themes
 * and what was removed) alongside what the flows need. Whether the sidebar is
 * open and whether the Studio shows twice is not the machine's: the tool
 * reducer in `ThemerProvider` owns that, so that the navbar toggle and the
 * sidebar can change it in transitions of their own. Nor is persisting: the
 * machine never touches storage and takes no input — it starts from no
 * themes, and a session with something to pick up from restores its
 * persisted snapshot instead (see `storage.ts` and `sync.ts`), while the
 * persisted state of other tabs reaches it as a `themes.sync` event like any
 * other.
 *
 * The `theme` region is `switching` (its tag) right after an event that
 * applies another theme — picking one, adding, duplicating, importing or
 * editing one, removing or deleting the applied one — which is when the
 * layout cross-fades the Studio to it. Edits to the applied theme's colors are
 * not switches, they follow the pointer: the first one ends the switch, and so
 * does `MOTION_DURATION` when none follows.
 *
 * Theme operations are handled in every flow, and the flows leave on their
 * own when they lose their subject: the editor when its theme is removed or
 * deleted, and the removed view when its last theme is restored or deleted.
 *
 * @internal
 */
export const themerMachine = setup({
  // XState reads `types` for their types only — the values are never used
  types: {
    // oxlint-disable-next-line no-unsafe-type-assertion -- type-level placeholder
    context: {} as ThemerMachineContext,
    // oxlint-disable-next-line no-unsafe-type-assertion -- type-level placeholder
    events: {} as ThemerEvent,
  },
  guards: {
    isCustomTheme: ({context}, params: {slug: string}) =>
      themesOf(context).themes.some(
        (theme) => theme.slug === params.slug && theme.source === 'custom',
      ),
    isEditingListedTheme: ({context}) =>
      context.editing !== null &&
      themesOf(context).themes.some(
        (theme) => theme.slug === context.editing?.slug && theme.source === 'custom',
      ),
    hasRemovedThemes: ({context}) => themesOf(context).removed.length > 0,
    // The configured theme has no code to show — it is the Studio's own
    hasAppliedTheme: ({context}) => themesOf(context).active !== undefined,
    // Only another theme than the applied one changes anything to cross-fade to
    isAnotherTheme: ({context}, params: {slug: string}) =>
      params.slug !== (context.active ?? CONFIG_SLUG),
    // Removing or deleting the applied theme is what changes the applied theme
    isAppliedTheme: ({context}, params: {slug: string}) => params.slug === context.active,
    // Another tab applied another theme, which is as much of a switch as picking it here
    appliesAnotherTheme: ({context}, params: {state: ThemerState}) =>
      params.state.active !== context.active,
    // A theme added from given options (an image's) looks different from the applied one
    hasOptions: (_, params: {options: BuildThemeOptions | undefined}) =>
      params.options !== undefined,
  },
  actions: {
    // Another tab's persisted state replaces this one's: themes, order and
    // all. The images of this session stay, they are this tab's
    sync: assign((_, params: {state: ThemerState}) => ({
      active: params.state.active,
      custom: params.state.custom,
      removed: params.state.removed,
      order: params.state.order,
    })),
    // The image of a replaced palette or a deleted theme is released from memory
    revokeImage: (_, params: {url: string | undefined}) => {
      if (params.url) revokeObjectUrl(params.url)
    },
    pick: assign((_, params: {slug: string}) => ({
      active: params.slug === CONFIG_SLUG ? null : params.slug,
    })),
    add: assign(
      (
        {context},
        params: {
          title?: string
          options?: BuildThemeOptions
          palette?: ImagePalette
          imageUrl?: string
        },
      ) => {
        // Based on the applied theme — the stock one when the configured
        // theme applies, which is not in the list
        const theme = createCustomTheme(
          params.title ?? UNTITLED_THEME,
          params.options ?? themesOf(context).active?.options ?? {},
          params.palette,
        )

        return {
          active: theme.slug,
          custom: [...context.custom, theme],
          // A theme named after its image needs no renaming right away
          editing: {slug: theme.slug, focusTitle: params.title === undefined},
          images: params.imageUrl
            ? {...context.images, [theme.slug]: params.imageUrl}
            : context.images,
        }
      },
    ),
    import: assign(({context}, params: {title: string; options: BuildThemeOptions}) => {
      const theme = createCustomTheme(params.title, params.options)

      return {active: theme.slug, custom: [...context.custom, theme]}
    }),
    duplicate: assign(({context}, params: {slug: string}) => {
      const {themes, removed} = themesOf(context)
      // The configured theme is not in the list: a copy of it starts from the
      // stock options, as the Studio shows it
      const source =
        params.slug === CONFIG_SLUG
          ? {title: CONFIG_TITLE, options: {}, palette: undefined}
          : [...themes, ...removed].find((theme) => theme.slug === params.slug)

      if (!source) return {}

      const theme = createCustomTheme(duplicateTitle(source.title), source.options, source.palette)

      return {
        active: theme.slug,
        custom: [...context.custom, theme],
        editing: {slug: theme.slug, focusTitle: true},
      }
    }),
    startEditing: assign((_, params: {slug: string}) => ({
      active: params.slug,
      editing: {slug: params.slug, focusTitle: false},
    })),
    stopEditing: assign({editing: null}),
    update: assign(
      (
        {context},
        params: {
          slug: string
          title?: string
          options?: BuildThemeOptions
          palette?: ImagePalette
          imageUrl?: string
        },
      ) => ({
        custom: context.custom.map((theme) => {
          if (theme.slug !== params.slug) return theme

          // Keep the options identity when only the title changes, so the
          // applied theme is not rebuilt on every keystroke
          return {
            ...theme,
            title: params.title ?? theme.title,
            options: params.options ?? theme.options,
            ...(params.palette ? {palette: params.palette} : {}),
          }
        }),
        images:
          params.imageUrl && context.custom.some((theme) => theme.slug === params.slug)
            ? {...context.images, [params.slug]: params.imageUrl}
            : context.images,
      }),
    ),
    remove: assign(({context}, params: {slug: string}) => {
      if (params.slug === CONFIG_SLUG || context.removed.includes(params.slug)) return {}

      return {
        active: context.active === params.slug ? null : context.active,
        removed: [...context.removed, params.slug],
      }
    }),
    restore: assign(({context}, params: {slug: string}) => ({
      removed: context.removed.filter((slug) => slug !== params.slug),
    })),
    reorder: assign(({context}, params: {order: string[]}) => {
      const listed = new Set(themesOf(context).themes.map((theme) => theme.slug))
      const order = params.order.filter((slug) => listed.has(slug))

      // The removed themes keep their place in line for when they are restored
      return {
        order: [...order, ...context.order.filter((slug) => !order.includes(slug))],
      }
    }),
    delete: assign(({context}, params: {slug: string}) => {
      if (!context.custom.some((theme) => theme.slug === params.slug)) return {}

      const {[params.slug]: _deleted, ...images} = context.images

      return {
        active: context.active === params.slug ? null : context.active,
        custom: context.custom.filter((theme) => theme.slug !== params.slug),
        removed: context.removed.filter((slug) => slug !== params.slug),
        images,
      }
    }),
  },
}).createMachine({
  id: 'themer',
  context: () => ({...initialThemerState, editing: null, images: {}}),
  type: 'parallel',
  states: {
    theme: {
      initial: 'applied',
      states: {
        // Only events that change what is applied count: adding a copy of the
        // applied theme, editing or duplicating it, picking it again, or
        // removing another theme leaves the Studio looking the same — with
        // nothing to cross-fade, the switch would only linger until the first
        // edit that followed, which must follow the pointer
        applied: {
          on: {
            'theme.pick': {
              guard: {type: 'isAnotherTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
            },
            'theme.edit': {
              guard: {type: 'isAnotherTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
            },
            'theme.duplicate': {
              guard: {type: 'isAnotherTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
            },
            'theme.remove': {
              guard: {type: 'isAppliedTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
            },
            'theme.delete': {
              guard: {type: 'isAppliedTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
            },
            'theme.add': {
              guard: {type: 'hasOptions', params: ({event}) => ({options: event.options})},
              target: 'switching',
            },
            'theme.import': 'switching',
            'themes.sync': {
              guard: {type: 'appliesAnotherTheme', params: ({event}) => ({state: event.state})},
              target: 'switching',
            },
          },
        },
        switching: {
          tags: ['switching'],
          after: {[MOTION_DURATION]: 'applied'},
          on: {
            // The editor edits the applied theme, and its colors must follow
            // the pointer rather than cross-fade — a switch is over at the
            // first edit, however soon it comes
            'theme.update': 'applied',
            // Another switch starts the clock over
            'theme.pick': {
              guard: {type: 'isAnotherTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
              reenter: true,
            },
            'theme.edit': {
              guard: {type: 'isAnotherTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
              reenter: true,
            },
            'theme.duplicate': {
              guard: {type: 'isAnotherTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
              reenter: true,
            },
            'theme.remove': {
              guard: {type: 'isAppliedTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
              reenter: true,
            },
            'theme.delete': {
              guard: {type: 'isAppliedTheme', params: ({event}) => ({slug: event.slug})},
              target: 'switching',
              reenter: true,
            },
            'theme.add': {
              guard: {type: 'hasOptions', params: ({event}) => ({options: event.options})},
              target: 'switching',
              reenter: true,
            },
            'theme.import': {target: 'switching', reenter: true},
            'themes.sync': {
              guard: {type: 'appliesAnotherTheme', params: ({event}) => ({state: event.state})},
              target: 'switching',
              reenter: true,
            },
          },
        },
      },
    },
    flow: {
      initial: 'list',
      on: {
        'theme.pick': {
          actions: [{type: 'pick', params: ({event}) => ({slug: event.slug})}],
        },
        'theme.add': {
          target: '.edit',
          actions: [
            {
              type: 'add',
              params: ({event}) => ({
                title: event.title,
                options: event.options,
                palette: event.palette,
                imageUrl: event.imageUrl,
              }),
            },
          ],
        },
        'theme.duplicate': {
          target: '.edit',
          actions: [{type: 'duplicate', params: ({event}) => ({slug: event.slug})}],
        },
        'theme.edit': {
          target: '.edit',
          guard: {type: 'isCustomTheme', params: ({event}) => ({slug: event.slug})},
          actions: [{type: 'startEditing', params: ({event}) => ({slug: event.slug})}],
        },
        'theme.update': {
          actions: [
            // A new image replaces the one the theme had
            {
              type: 'revokeImage',
              params: ({context, event}) => ({
                url: event.imageUrl ? context.images[event.slug] : undefined,
              }),
            },
            {
              type: 'update',
              params: ({event}) => ({
                slug: event.slug,
                title: event.title,
                options: event.options,
                palette: event.palette,
                imageUrl: event.imageUrl,
              }),
            },
          ],
        },
        'theme.remove': {
          actions: [{type: 'remove', params: ({event}) => ({slug: event.slug})}],
        },
        'theme.restore': {
          actions: [{type: 'restore', params: ({event}) => ({slug: event.slug})}],
        },
        'theme.delete': {
          actions: [
            {
              type: 'revokeImage',
              params: ({context, event}) => ({url: context.images[event.slug]}),
            },
            {type: 'delete', params: ({event}) => ({slug: event.slug})},
          ],
        },
        'theme.reorder': {
          actions: [{type: 'reorder', params: ({event}) => ({order: event.order})}],
        },
        'theme.import': {
          actions: [
            {
              type: 'import',
              params: ({event}) => ({title: event.title, options: event.options}),
            },
          ],
        },
        'themes.sync': {
          actions: {type: 'sync', params: ({event}) => ({state: event.state})},
        },
        'flow.list': '.list',
        'flow.removed': {
          target: '.removed',
          guard: 'hasRemovedThemes',
        },
      },
      states: {
        list: {
          initial: 'idle',
          // The list's dialogs — for a shared code pasted by hand, and for the
          // applied theme's snippet — are states of the list, so that leaving
          // it, as adding a theme does for the editor, closes them
          states: {
            idle: {
              on: {
                'dialog.paste': 'pasting',
                'dialog.snippet': {guard: 'hasAppliedTheme', target: 'snippet'},
              },
            },
            pasting: {
              on: {'dialog.close': 'idle'},
            },
            snippet: {
              on: {'dialog.close': 'idle'},
              // The applied theme can go away meanwhile — removed from another tab
              always: {guard: not('hasAppliedTheme'), target: 'idle'},
            },
          },
        },
        edit: {
          exit: 'stopEditing',
          // The theme being edited can go away — removed from the editor, or
          // duplicated from a theme that does not exist — and then there is
          // nothing left to edit
          always: {guard: not('isEditingListedTheme'), target: 'list'},
        },
        removed: {
          always: {guard: not('hasRemovedThemes'), target: 'list'},
        },
      },
    },
  },
})

/** @internal */
export type ThemerSnapshot = SnapshotFrom<typeof themerMachine>

/** The part of the machine context that is persisted between sessions @internal */
export function selectStoredState(snapshot: ThemerSnapshot): ThemerState {
  const {active, custom, removed, order} = snapshot.context

  return {active, custom, removed, order}
}
