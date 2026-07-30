import {useEditor} from '@portabletext/editor'
import {Box, Card, Flex, Hotkeys, Popover, Stack, Text, useToast} from '@sanity/ui'
import type {CSSProperties} from 'react'
import {useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState} from 'react'
import {useResolveInitialValueForType, useSchema} from 'sanity'
import type {SchemaType} from 'sanity'

import {derivePickerItems, unknownMetadataTypes} from './deriveItems'
import {filterPickerItems} from './filterItems'
import {flattenSections, groupPickerItems} from './groupItems'
import {createCleanupQueryBehavior, createInsertBehavior, sendCleanupQuery} from './insertBehavior'
import {insertPickerItem} from './insertPickerItem'
import {
  type BlockInsertPickerLabels,
  formatNoMatches,
  formatPosition,
  resolveLabels,
} from './labels'
import {usePickerItemsContext} from './memberSchemaTypes'
import {useOpenBlockOnInsert} from './openBlockOnInsert'
import {createPickerBehavior} from './pickerBehavior'
import {pickerReducer} from './pickerReducer'
import {applyPresetMetadata} from './presets'
import {resolveItemPresentation} from './resolveItemPresentation'
import type {
  PickerInsertEvent,
  PickerIntent,
  PickerItem,
  PickerItemMetadata,
  PickerItemsContext,
  PickerItemsResolver,
  PickerState,
} from './types'

export type BlockInsertPickerProps = {
  /**
   * Per-member curation (trigger, keywords, group, description, badge,
   * hidden, openOnInsert) merged into the items derived from the array's
   * members; array order is the rank. Members without an entry still get
   * items, in schema order.
   */
  items?: readonly PickerItemMetadata[]
  /**
   * Escape hatch: names the portable-text array type to resolve items from
   * when Studio's member-schema context is unavailable. With the context
   * present (any supported sanity version) this is ignored — the containing
   * array and its members are detected automatically.
   */
  arrayTypeName?: string
  /**
   * Programmatic seam over the derived-and-curated item list: reorder,
   * remove, relabel, or append items (including `custom`-action items).
   */
  resolveItems?: PickerItemsResolver
  /**
   * Replaces the built-in matching (see filterPickerItems). Receives the
   * bare query in both modes — the slash-mode "/" prefix is stripped.
   */
  filter?: (items: readonly PickerItem[], query: string) => readonly PickerItem[]
  /** Overrides for the picker chrome's user-facing strings. */
  labels?: Partial<BlockInsertPickerLabels>
  /** Notified after each successful insert, alongside open-on-insert. */
  onInsert?: (event: PickerInsertEvent) => void
  /**
   * Whether an inserted block opens for editing (default true). Items can
   * override per member via their metadata's `openOnInsert`.
   */
  openOnInsert?: boolean
  /** Whether Cmd/Ctrl+/ opens the picker (default true). */
  shortcut?: boolean
  /**
   * Whether well-known block types (image, file, code, table, ...) get
   * default triggers and keywords when the host's `items` doesn't cover
   * them (default true). See standardBlockPresets.
   */
  presets?: boolean
}

export function BlockInsertPicker({
  arrayTypeName,
  filter,
  items,
  labels: labelOverrides,
  onInsert,
  openOnInsert = true,
  presets = true,
  resolveItems,
  shortcut = true,
}: BlockInsertPickerProps) {
  const editor = useEditor()
  const openBlockOnInsert = useOpenBlockOnInsert()
  const itemsContext = usePickerItemsContext(arrayTypeName)
  const schema = useSchema()
  const resolveInitialValueForType = useResolveInitialValueForType()
  const toast = useToast()
  const labels = useMemo(() => resolveLabels(labelOverrides), [labelOverrides])
  // Instance-scoped so ARIA option ids stay unique when several PTE fields
  // (each with their own picker) mount on the same document.
  const instanceId = useId()
  const listboxId = `${instanceId}-listbox`
  const optionId = (id: string) => `${instanceId}-option-${id}`

  // Items derive from the array's member types (via Studio's member-schema
  // context, or the arrayTypeName fallback), curated by the metadata in
  // `items` and decorated by presets. Titles and icons are then enriched
  // ONCE from the member type — not the global type of the same name — so
  // member-level config wins: a member that redefines a core type's name
  // shows its own icon and title rather than the global type's. Enriching
  // before filtering keeps query matching aligned with what the popover
  // displays, and `resolveItems` runs last over the fully-presented list so
  // hosts relabel or append against what would actually render.
  const pickerItems = useMemo(() => {
    if (!itemsContext) return []
    const derived = presets
      ? applyPresetMetadata(derivePickerItems(itemsContext, items), itemsContext)
      : derivePickerItems(itemsContext, items)
    const presented = derived.map((item) => {
      if (item.action.type !== 'insertBlock') return item
      const schemaType = memberTypeFor(itemsContext, schema, item.action.blockType)
      const presentation = resolveItemPresentation(item, schemaType)
      // The derived items are fresh objects owned by this memo, so in-place
      // assignment is safe (and satisfies oxc's no-map-spread).
      return Object.assign(item, {
        description: presentation.description,
        icon: presentation.icon,
        title: presentation.title,
      })
    })
    return resolveItems ? [...resolveItems(presented, itemsContext)] : presented
  }, [items, itemsContext, presets, resolveItems, schema])

  const hasItems = pickerItems.length > 0

  // Dev-mode configuration diagnostics, once per mount per category: a
  // silent picker (no context, or nothing derivable) and typo'd metadata
  // keys are the two misconfigurations schema-derived items can't surface
  // on their own.
  const warnedRef = useRef<{context?: boolean; empty?: boolean; unknown?: boolean}>({})
  useEffect(() => {
    if (process.env['NODE_ENV'] === 'production') return
    const warned = warnedRef.current
    if (!itemsContext && !warned.context) {
      warned.context = true
      console.warn(
        '[@sanity/block-insert-picker] No Portable Text member schema context found and no ' +
          '`arrayTypeName` resolved to an array type — the picker is disabled for this field.',
      )
      return
    }
    if (itemsContext && items && !warned.unknown) {
      const unknown = unknownMetadataTypes(itemsContext, items)
      if (unknown.length > 0) {
        warned.unknown = true
        console.warn(
          `[@sanity/block-insert-picker] \`items\` metadata references types that are not ` +
            `members of this array: ${unknown.join(', ')}`,
        )
      }
    }
    if (itemsContext && !hasItems && !warned.empty) {
      warned.empty = true
      console.warn(
        '[@sanity/block-insert-picker] No insertable items: the array has no non-text-block ' +
          'members (and `resolveItems` added none) — the picker is disabled for this field.',
      )
    }
  }, [hasItems, items, itemsContext])

  const [state, dispatch] = useReducer(pickerReducer, {mode: 'closed'})

  // stateRef gives behavior callbacks synchronous access to the latest state
  // without needing to re-register the behavior on every state change.
  // useLayoutEffect (vs useEffect) ensures the ref is in sync before paint,
  // closing a stale-read window for chained behavior events within a tick.
  const stateRef = useRef<PickerState>(state)
  useLayoutEffect(() => {
    stateRef.current = state
  })

  // The shortcut flag is read through a ref for the same reason: the guard
  // consults it per keystroke, so toggling it must not re-register (and
  // re-sort) the behavior chain.
  const shortcutRef = useRef(shortcut)
  useLayoutEffect(() => {
    shortcutRef.current = shortcut
  })

  const open = state.mode !== 'closed'
  const query = open ? state.query : ''
  const mode = open ? state.mode : null

  const filterItems = filter ?? filterPickerItems
  // The filter seam receives the query without the slash-mode "/" prefix, so
  // a custom `filter` sees the same bare text in both modes. The raw query
  // keeps driving the empty-state label, the shortcut echo, and onInsert.
  const filterQuery = mode === 'slash' ? bareQuery(query) : query

  // Sections drive the rendered layout (group headers); `filtered` is the same
  // items flattened into the single index space navigation and selection share.
  const sections = useMemo(
    () => groupPickerItems(filterItems(pickerItems, filterQuery)),
    [filterItems, filterQuery, pickerItems],
  )
  const filtered = useMemo(() => flattenSections(sections), [sections])
  // Rows resolve their flat index positionally (section offset + row index),
  // never by item id: a resolveItems-appended item may reuse a derived id,
  // and an id-keyed map would point both rows at one index.
  const sectionOffsets = useMemo(() => {
    const offsets: number[] = []
    let total = 0
    for (const section of sections) {
      offsets.push(total)
      total += section.items.length
    }
    return offsets
  }, [sections])
  // A lone section carries no useful category label (e.g. a curated `items`
  // prop, or a filter that matched a single group) — skip the header chrome.
  const showGroupHeaders = sections.length > 1

  // Guards the async select path: a second select arriving while a slow
  // initial-value resolution is in flight must not double-insert.
  const insertInFlightRef = useRef(false)

  // Plain functions below (no useCallback): the React Compiler memoizes
  // them, and its lint rule rejects hand-written dependency arrays here.
  // Core selection logic: given a resolved item index into the filtered list for
  // `current` state, perform the insertion. Extracted so both keyboard-Enter
  // (via handleIntent) and mouse-click (via selectItemAtIndex) share the same
  // path without reading a potentially-stale highlightedIndex from stateRef.
  // The initial value resolves at select time (mirroring Studio's own toolbar
  // handleInsertBlock flow) so the first select in a session can't race an
  // eager cache, and resolution errors surface instead of being swallowed.
  const insertItemAtIndex = async (
    current: Exclude<PickerState, {mode: 'closed'}>,
    idx: number,
  ) => {
    if (insertInFlightRef.current) {
      // A prior select is still resolving; bail to avoid a double-insert. Still
      // close, because the user may have reopened the picker mid-flight and a
      // stuck-open menu that swallows this Enter looks broken.
      dispatch({type: 'close'})
      return
    }
    insertInFlightRef.current = true
    try {
      // Index into the grouped display order (not the raw rank-flat order)
      // so the row the user sees highlighted is the one that gets inserted.
      const visible = flattenSections(
        groupPickerItems(
          filterItems(
            pickerItems,
            current.mode === 'slash' ? bareQuery(current.query) : current.query,
          ),
        ),
      )
      const clamped = Math.max(0, Math.min(visible.length - 1, idx))
      const chosen = visible[clamped]
      // Close immediately for a snappy response; the insert continues from
      // the captured `current` state.
      dispatch({type: 'close'})
      if (!chosen) return
      if (chosen.action.type === 'custom') {
        // No block to insert: clean up the typed "/query" text (slash mode)
        // and hand the editor to the host's action.
        sendCleanupQuery(editor, {
          anchorBlockKey: current.anchorBlockKey,
          mode: current.mode,
          query: current.query,
        })
        chosen.action.onSelect({
          closePicker: () => dispatch({type: 'close'}),
          editor,
        })
        return
      }
      const blockType = chosen.action.blockType
      let initialValue: Record<string, unknown> | undefined
      const schemaType = memberTypeFor(itemsContext, schema, blockType)
      if (schemaType) {
        initialValue = (await resolveInitialValueForType(schemaType, {})) ?? undefined
      }
      // Re-take the snapshot after the await; the document may have changed.
      // A null selection is fine: the insert behavior anchors the block via
      // `at` from anchorBlockKey, so a blur during a slow resolution (or a
      // shortcut-mode open with no selection) must not abort the insert.
      const snapshot = editor.getSnapshot()
      // Confirm the anchor block still exists in the document; if it was
      // deleted while the picker was open we have nothing to anchor against.
      const anchorStillExists = snapshot.context.value.some(
        (b) => b._key === current.anchorBlockKey,
      )
      if (!anchorStillExists) {
        toast.push({
          closable: true,
          description: labels.insertAnchorRemoved,
          status: 'warning',
          title: labels.insertError,
        })
        return
      }
      insertPickerItem({
        anchorBlockKey: current.anchorBlockKey,
        blockType,
        editor,
        initialValue,
        keyGenerator: () => snapshot.context.keyGenerator(),
        mode: current.mode,
        onInsertedKey: (key) => {
          if (chosen.openOnInsert ?? openOnInsert) openBlockOnInsert(key)
          onInsert?.({
            blockKey: key,
            blockType,
            mode: current.mode,
            query: current.query,
            via: 'picker',
          })
        },
        query: current.query,
      })
    } catch (error) {
      // insertItemAtIndex is fire-and-forget (`void insertItemAtIndex(...)`),
      // so anything thrown here — initial-value resolution, a host `filter`,
      // a custom action's onSelect, a host onInsert — would otherwise become
      // an unhandled rejection with no user feedback.
      toast.push({
        closable: true,
        description: error instanceof Error ? error.message : String(error),
        status: 'error',
        title: labels.insertError,
      })
    } finally {
      insertInFlightRef.current = false
    }
  }

  // Rows call this from onClick with their own index rather than reading
  // highlightedIndex: the onMouseMove highlight update for the row under the
  // cursor may not have flushed yet, so passing idx avoids inserting the
  // previously-highlighted row.
  const selectItemAtIndex = (idx: number) => {
    const current = stateRef.current
    if (current.mode === 'closed') return
    void insertItemAtIndex(current, idx)
  }

  const handleIntent = (intent: PickerIntent) => {
    if (intent.type === 'navigate') {
      // The reducer deliberately doesn't clamp (it can't know the filtered
      // list length), so resolve the move here. Clamping the base index too
      // self-heals any stored value that has drifted out of range — an
      // unclamped store makes reversed arrow presses appear "dead" while a
      // hidden out-of-bounds index counts back into range.
      const current = stateRef.current
      if (current.mode === 'closed') return
      const lastIndex = filtered.length - 1
      const base = Math.max(0, Math.min(lastIndex, current.highlightedIndex))
      const next = Math.max(0, Math.min(lastIndex, base + intent.delta))
      dispatch({index: next, type: 'setHighlightedIndex'})
      return
    }
    if (intent.type !== 'select') {
      dispatch(intent)
      return
    }
    // Resolve the currently-highlighted item against the filtered list.
    const current = stateRef.current
    if (current.mode === 'closed') return
    void insertItemAtIndex(current, current.highlightedIndex)
  }

  // handleIntentRef lets the behavior always call the latest handleIntent
  // without needing to re-register the behavior when items changes.
  // useLayoutEffect for the same stale-read-window reason as stateRef above.
  const handleIntentRef = useRef<(intent: PickerIntent) => void>(handleIntent)
  useLayoutEffect(() => {
    handleIntentRef.current = handleIntent
  })

  // Register behaviors imperatively so their lifecycle follows this
  // component's — and only while there is anything to offer: with zero
  // items the picker must never open (no empty popover, no swallowed "/").
  // The picker behavior watches typing/keys; the insert behavior performs
  // the atomic cleanup + insert when a custom.blockInsertPicker.insert
  // event arrives; the cleanup behavior serves `custom` item actions.
  useEffect(() => {
    if (!hasItems) return undefined
    const behavior = createPickerBehavior({
      getState: () => stateRef.current,
      isShortcutEnabled: () => shortcutRef.current,
      onIntent: (intent) => handleIntentRef.current(intent),
    })
    const unregisterPicker = editor.registerBehavior({behavior})
    const unregisterInsert = editor.registerBehavior({
      behavior: createInsertBehavior(),
    })
    const unregisterCleanup = editor.registerBehavior({
      behavior: createCleanupQueryBehavior(),
    })
    return () => {
      unregisterPicker()
      unregisterInsert()
      unregisterCleanup()
    }
  }, [editor, hasItems])

  // If the item list empties while the picker is open (a resolveItems change,
  // a schema hot-reload), the behaviors above unregister — close the popover
  // rather than leaving a zombie that no behavior can drive.
  useEffect(() => {
    if (!hasItems && stateRef.current.mode !== 'closed') dispatch({type: 'close'})
  }, [hasItems])

  // --- UI ---

  const highlightedIndex = open
    ? Math.max(0, Math.min(filtered.length - 1, state.highlightedIndex))
    : 0

  // Announced to screen readers via a polite live region: the focus stays in
  // the editor, so aria-selected alone would never be read aloud. Recomputing
  // this on every highlight/filter change lets assistive tech track the list.
  const highlightedItem = open ? filtered[highlightedIndex] : undefined
  const announcement = highlightedItem
    ? [
        highlightedItem.title,
        highlightedItem.description,
        formatPosition(labels, highlightedIndex + 1, filtered.length),
      ]
        .filter(Boolean)
        .join(', ')
    : ''

  // Capture the caret DOMRect once when the picker opens and hand Popover a
  // virtual reference element wrapping it. The rect
  // is intentionally pinned at the opening position — re-capturing on every
  // `state` change (e.g. each keystroke that updates `query`) would make the
  // popover drift right as the caret advances through typed characters.
  // editor.dom is the supported anchoring API; a collapsed caret in an empty
  // block can yield an all-zero rect in some browsers, so fall back to the
  // block element's rect in that case.
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      // oxlint-disable-next-line react/react-compiler
      setCursorRect(null)
      return
    }
    const snapshot = editor.getSnapshot()
    const rect = editor.dom.getSelectionRect(snapshot)
    if (rect && (rect.x || rect.y || rect.width || rect.height)) {
      setCursorRect(rect)
      return
    }
    const blockRect = editor.dom.getStartBlockElement(snapshot)?.getBoundingClientRect()
    if (blockRect) setCursorRect(blockRect)
  }, [editor, open])

  // Close on any pointerdown outside the popover (clicking into another block
  // must not leave a zombie picker that later intercepts Enter), and when
  // focus leaves the editor entirely (e.g. Tab). @sanity/ui's Popover has no
  // onClickOutside prop — that lives on Menu/Dialog — so listen manually.
  const popoverContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && popoverContentRef.current?.contains(target)) return
      dispatch({type: 'close'})
    }
    // getEditorElement is typed as Element, whose addEventListener overload
    // hands the listener a plain Event; narrow to FocusEvent inside instead
    // of asserting the element type.
    const editorElement = editor.dom.getEditorElement()
    const handleFocusOut = (event: Event) => {
      const next = event instanceof FocusEvent ? event.relatedTarget : null
      if (
        next instanceof Node &&
        (editorElement?.contains(next) || popoverContentRef.current?.contains(next))
      )
        return
      dispatch({type: 'close'})
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    editorElement?.addEventListener('focusout', handleFocusOut)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      editorElement?.removeEventListener('focusout', handleFocusOut)
    }
  }, [editor, open])

  // Keep the highlighted row visible inside the scrolling list.
  const highlightedRowRef = useRef<HTMLDivElement | null>(null)

  // Hover may only move the highlight on genuine pointer movement. When
  // keyboard navigation scrolls the list (scrollIntoView below), rows slide
  // under a stationary cursor and the browser fires mouseenter — and, in some
  // engines, a coordinate-identical mousemove — on whichever row lands there.
  // Honoring those synthetic events hijacks the keyboard highlight back to
  // wherever the mouse happens to rest. Track the last seen coordinates and
  // require them to change before hover wins; the first event only seeds.
  const lastPointerRef = useRef<null | {x: number; y: number}>(null)

  const highlightOnPointerMove = (idx: number, x: number, y: number) => {
    const last = lastPointerRef.current
    lastPointerRef.current = {x, y}
    if (!last || (last.x === x && last.y === y)) return
    const current = stateRef.current
    if (current.mode !== 'closed' && idx !== current.highlightedIndex) {
      dispatch({index: idx, type: 'setHighlightedIndex'})
    }
  }

  useEffect(() => {
    highlightedRowRef.current?.scrollIntoView({block: 'nearest'})
  }, [highlightedIndex])

  // Stable virtual element derived from the captured rect — keeps Popover
  // positioning stable even as `state` changes while the picker is open.
  const cursorElement = useMemo(() => {
    if (!cursorRect) return null
    // Popover types referenceElement as HTMLElement, but its positioning
    // only ever reads getBoundingClientRect — the standard virtual-element
    // escape hatch for anchoring to a caret rect.
    // oxlint-disable-next-line no-unsafe-type-assertion
    return {
      getBoundingClientRect: () => cursorRect,
    } as unknown as HTMLElement
  }, [cursorRect])

  if (!open) return null

  if (filtered.length === 0) {
    return (
      <Popover
        constrainSize
        content={
          <Card
            aria-live="polite"
            onMouseDown={preventFocusSteal}
            padding={3}
            radius={2}
            ref={popoverContentRef}
            // Card renders (and refs) a div; an <output> would change the
            // element type the outside-pointerdown ref relies on.
            // oxlint-disable-next-line prefer-tag-over-role
            role="status"
          >
            <Text muted size={1}>
              {formatNoMatches(labels, query)}
            </Text>
          </Card>
        }
        fallbackPlacements={['top-start']}
        open
        placement="bottom-start"
        portal
        preventOverflow
        referenceElement={cursorElement}
      />
    )
  }

  return (
    <Popover
      constrainSize
      content={
        <Card
          onMouseDown={preventFocusSteal}
          padding={1}
          radius={2}
          ref={popoverContentRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            minWidth: 300,
          }}
        >
          {/* Focus stays in the editor, so aria-selected on rows is never read
              aloud on its own. This polite region carries the open state and
              each highlight change to assistive tech. */}
          <output aria-live="polite" style={SR_ONLY}>
            {announcement}
          </output>
          <Flex align="center" flex="none" gap={2} padding={2}>
            <Box flex={1}>
              <Text
                muted
                size={0}
                style={{letterSpacing: '0.05em', textTransform: 'uppercase'}}
                weight="medium"
              >
                {labels.title}
              </Text>
            </Box>
            {mode === 'shortcut' && query !== '' ? (
              // Shortcut-mode typing never reaches the document, so echo the
              // captured query here — otherwise keystrokes appear to vanish.
              <Text muted size={1} textOverflow="ellipsis">
                {query}
              </Text>
            ) : null}
          </Flex>
          <Box
            aria-label={labels.title}
            id={listboxId}
            // A custom ARIA listbox: <select>/<datalist> cannot host rich
            // rows (icons, descriptions, hotkey chips) or grouped sections.
            // oxlint-disable-next-line prefer-tag-over-role
            role="listbox"
            style={{flex: 1, maxHeight: 320, minHeight: 0, overflowY: 'auto'}}
          >
            {sections.map((section, sectionIndex) => {
              const sectionLabel = section.group ?? labels.ungroupedSection
              // Key on the raw group (namespaced), not the display label: a
              // curated group named the same as `ungroupedSection` would
              // otherwise share a React key with the null-group section.
              const sectionKey = section.group === null ? 'ungrouped' : `group:${section.group}`
              const rows = section.items.map((item, rowIndex) => {
                const idx = (sectionOffsets[sectionIndex] ?? 0) + rowIndex
                const Icon = item.icon
                const isHighlighted = idx === highlightedIndex
                return (
                  <Card
                    aria-selected={isHighlighted}
                    id={optionId(String(idx))}
                    key={`${item.id}-${idx}`}
                    onClick={() => selectItemAtIndex(idx)}
                    onMouseMove={(event) =>
                      highlightOnPointerMove(idx, event.clientX, event.clientY)
                    }
                    padding={2}
                    radius={1}
                    ref={isHighlighted ? highlightedRowRef : undefined}
                    // A native <option> only works inside <select>; these are
                    // ARIA options in a custom listbox rendered from Cards.
                    // oxlint-disable-next-line prefer-tag-over-role
                    role="option"
                    style={{cursor: 'pointer'}}
                    // Focusable in principle (never via Tab): DOM focus stays
                    // in the editor and the live region does the announcing.
                    tabIndex={-1}
                    tone={isHighlighted ? 'primary' : 'default'}
                  >
                    <Flex align="center" gap={3}>
                      <Box
                        style={{
                          alignItems: 'center',
                          display: 'flex',
                          height: 22,
                          justifyContent: 'center',
                          width: 22,
                        }}
                      >
                        {Icon ? <Icon /> : null}
                      </Box>
                      <Stack flex={1} gap={2}>
                        <Text size={1} textOverflow="ellipsis">
                          {item.title}
                        </Text>
                        {item.description ? (
                          <Text muted size={0} textOverflow="ellipsis">
                            {item.description}
                          </Text>
                        ) : null}
                      </Stack>
                      {item.badge ? (
                        <Box flex="none">
                          <Text muted size={0}>
                            {item.badge}
                          </Text>
                        </Box>
                      ) : null}
                      {item.trigger ? (
                        <Box flex="none">
                          <Hotkeys fontSize={0} keys={[item.trigger]} />
                        </Box>
                      ) : null}
                    </Flex>
                  </Card>
                )
              })
              if (!showGroupHeaders) {
                return (
                  <Stack key={sectionKey} gap={1}>
                    {rows}
                  </Stack>
                )
              }
              return (
                <Box
                  aria-label={sectionLabel}
                  key={sectionKey}
                  paddingTop={sectionIndex === 0 ? 0 : 2}
                  // Grouped options inside a listbox: role="group" is the
                  // valid ARIA structure here; the tags the rule suggests
                  // (fieldset, address, …) are not permitted in a listbox.
                  // oxlint-disable-next-line prefer-tag-over-role
                  role="group"
                >
                  <Box paddingBottom={1} paddingTop={2} paddingX={2}>
                    <Text
                      muted
                      size={0}
                      style={{
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                      weight="medium"
                    >
                      {sectionLabel}
                    </Text>
                  </Box>
                  <Stack gap={1}>{rows}</Stack>
                </Box>
              )
            })}
          </Box>
          <Card borderTop flex="none" padding={2} radius={0}>
            <Flex align="center" gap={3} wrap="wrap">
              <FooterHint keys={['↑', '↓']} label={labels.footerNavigate} />
              <FooterHint keys={['↵']} label={labels.footerInsert} />
              <FooterHint keys={['Esc']} label={labels.footerDismiss} />
              {shortcut ? (
                <FooterHint keys={[OPEN_MODIFIER, '/']} label={labels.footerAnywhere} />
              ) : null}
            </Flex>
          </Card>
        </Card>
      }
      fallbackPlacements={['top-start']}
      open
      placement="bottom-start"
      portal
      preventOverflow
      referenceElement={cursorElement}
    />
  )
}

// A single key legend in the teaching footer: the key chips plus a short verb.
function FooterHint({keys, label}: {keys: string[]; label: string}) {
  return (
    <Flex align="center" gap={2}>
      <Hotkeys fontSize={0} keys={keys} />
      <Text muted size={0}>
        {label}
      </Text>
    </Flex>
  )
}

// Module-level (not a component closure) so useMemo dependency arrays don't
// need a function that the react-hooks lint flags as changing every render.
// Member types resolve from the picker's items context first (member-level
// config wins), then from the global type of the same name — the same
// fallback the previous arrayTypeName-only lookup used.
function memberTypeFor(
  itemsContext: PickerItemsContext | null,
  schema: {get(name: string): SchemaType | undefined},
  blockType: string,
): SchemaType | undefined {
  const member = itemsContext?.memberTypes.find((candidate) => candidate.name === blockType)
  return member ?? schema.get(blockType)
}

// Slash-mode queries carry the leading "/" the writer typed; the filter seam
// works on the bare text (see filterQuery above).
function bareQuery(query: string): string {
  return query.startsWith('/') ? query.slice(1) : query
}

// Interacting with any popover surface (header, padding, the scroll
// container's scrollbar) must not steal DOM focus from the editor: the blur
// would trip the focusout close listener and dismiss the picker mid-use.
function preventFocusSteal(event: {preventDefault: () => void}) {
  event.preventDefault()
}

// Visually hidden but present in the accessibility tree — used for the live
// region so announcements don't disturb the popover layout.
const SR_ONLY: CSSProperties = {
  border: 0,
  clipPath: 'inset(50%)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
}

// The Cmd+/ shortcut symbol matches the platform: ⌘ on Apple, Ctrl elsewhere.
// navigator.platform is deprecated but still the most reliable signal here;
// fall back to the user agent, then to Ctrl when neither is available.
const IS_APPLE_PLATFORM =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent || '')
const OPEN_MODIFIER = IS_APPLE_PLATFORM ? '⌘' : 'Ctrl'
