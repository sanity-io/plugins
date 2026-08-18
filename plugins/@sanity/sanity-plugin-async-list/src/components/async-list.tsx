import {ApiIcon} from '@sanity/icons/Api'
import {SearchIcon} from '@sanity/icons/Search'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Button, Card, Flex, Text} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import debounce from 'lodash-es/debounce.js'
import {type JSX, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {set, type StringInputProps, unset, useClient} from 'sanity'

import type {AsyncListInputOptions} from '../types'

// Spinner shown in the Autocomplete `icon` slot while the loader is fetching.
// Defined at module scope so it has a stable identity across renders.
function LoadingIcon(): JSX.Element {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <SpinnerIcon
        style={{
          animation: 'spin 2s linear infinite',
        }}
      />
    </>
  )
}

// Object for Autocomplete's `options` prop
interface OptionsItem {
  value: string
  [key: string]: unknown
}

// Autocomplete options validation
function validOptions(arr: unknown): arr is OptionsItem[] {
  return (
    Array.isArray(arr) &&
    arr.every(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'value' in item &&
        typeof item.value === 'string',
    )
  )
}

/**
 * Props for the {@link AsyncList} input component: the standard Sanity string
 * input props plus the async-list `options`.
 *
 * @public
 */
export interface AsyncListInputProps extends StringInputProps {
  options: AsyncListInputOptions
}

/**
 * The async-list input component. It is a regular React component that takes a
 * single `props` argument, so it is safe under the Rules of Hooks and gets
 * optimized by the React Compiler.
 *
 * For the `components.input` slot, prefer {@link createAsyncListInput}, which
 * binds the options for you.
 *
 * TODO:
 * - Cache fetchData call w/o arguments
 *
 * @public
 */
export function AsyncList(props: AsyncListInputProps): JSX.Element {
  const {options} = props
  const namespace =
    options.secrets?.namespace ??
    (options.schemaType ? `async-list-${options.schemaType}` : 'async-list')

  // Warn (in dev) when secrets are configured but there is nothing stable to
  // derive a namespace from. Without an explicit `secrets.namespace` (or a
  // `schemaType` from the plugin), multiple component-usage fields would share
  // the same default namespace and collide.
  const secretsKeys = options.secrets?.keys
  const secretsNamespace = options.secrets?.namespace
  const schemaType = options.schemaType
  useEffect(() => {
    if (process.env['NODE_ENV'] === 'production') return
    if (secretsKeys && !secretsNamespace && !schemaType) {
      console.warn(
        'sanity-plugin-async-list: `secrets` is configured without `schemaType` or `secrets.namespace`. ' +
          'Set an explicit `secrets.namespace` to avoid collisions between fields.',
      )
    }
  }, [secretsKeys, secretsNamespace, schemaType])

  const {secrets} = useSecrets<Record<string, string> | undefined>(namespace)
  const [data, setData] = useState<OptionsItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [prevQuery, setPrevQuery] = useState<string | null>(null)
  const client = useClient(options.clientOptions ?? {apiVersion: '2024-12-12'})

  const fetchData = useCallback(
    async (query?: string) => {
      try {
        // Reset previous error state
        setError(null)
        setLoading(true)

        // Call user provided data loader
        const loaderData = await options.loader({secrets, query, client})

        // Validate and set data
        if (validOptions(loaderData)) {
          setData(loaderData)
        } else {
          console.error(
            'sanity-plugin-async-list data error - data must match options from @sanity/ui Autocomplete https://www.sanity.io/ui/docs/component/autocomplete',
            loaderData,
          )
          setError(new Error('Error with list data. Check console for more info.'))
        }
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : 'An unknown error occurred while fetching data'

        console.error('sanity-plugin-async-list fetch error:', errorMessage)
        setError(new Error('Error fetching list, check console for more info'))
      } finally {
        setLoading(false)
      }
    },
    [options, secrets, client],
  )

  useEffect(() => {
    // Don't fetch if we expect API keys but secrets don't exist
    if (options?.secrets?.keys && !secrets) return
    // fetch the initial data, but only if the field doesn't have a value
    if (!props.value && !data) {
      // Kicking off the initial load intentionally sets loading/error state on
      // mount so the field shows a spinner while the loader resolves.
      // oxlint-disable-next-line react/set-state-in-effect
      void fetchData()
    }
  }, [fetchData, data, secrets, options.secrets, props.value])

  // Set field value in content lake. Plain function: with React Compiler enabled
  // this is memoized automatically based on the `props.onChange` it captures.
  const handleChange = (value?: string) => props.onChange(value ? set(value) : unset())
  // Handle searching in 'search' mode
  const handleQueryChange = useCallback(
    (query: string | null) => {
      if (
        query === '' || // User hit backspace or
        (!query && !props.value && prevQuery) // they cleared out an existing value or query
      ) {
        if (!data) {
          void fetchData()
        }
      }
      if (query) {
        void fetchData(query)
      }
      setPrevQuery(query)
    },
    [fetchData, data, props.value, prevQuery],
  )

  // Keep a stable debounced wrapper that always calls the latest handler.
  // Depending on `handleQueryChange` in useMemo would recreate (and cancel) the
  // debounce after every search finishes (`data`/`prevQuery` change), dropping
  // keystrokes typed while a request was in flight.
  const handleQueryChangeRef = useRef(handleQueryChange)
  useEffect(() => {
    handleQueryChangeRef.current = handleQueryChange
  }, [handleQueryChange])

  const debouncedHandler = useMemo(
    // oxlint-disable-next-line react/refs
    () => debounce((value: string | null) => handleQueryChangeRef.current(value), 300),
    [],
  )

  // Cancel only on unmount — not when the underlying handler identity changes.
  useEffect(() => () => debouncedHandler.cancel(), [debouncedHandler])

  // Render error state as a readonly string field
  if (error) {
    const readOnlyProps = {
      ...props,
      elementProps: {...props.elementProps, readOnly: true},
    }

    return (
      <Card>
        {readOnlyProps.renderDefault(readOnlyProps)}
        <Card tone="critical" padding={2}>
          <Text size={1}>{error.message}</Text>
        </Card>
      </Card>
    )
  }
  if (props.readOnly) {
    return <Card>{props.renderDefault(props)}</Card>
  }
  return (
    <Card>
      <Autocomplete
        // Passthrough first; critical form/id props below always win.
        {...options.autocompleteProps}
        id={props.elementProps.id}
        filterOption={
          options.autocompleteProps?.filterOption ??
          (options.loaderType === 'search' ? () => true : undefined)
        }
        icon={loading ? LoadingIcon : (options.autocompleteProps?.icon ?? SearchIcon)}
        openButton={options.autocompleteProps?.openButton ?? true}
        onChange={handleChange}
        options={data ?? []}
        value={props.value}
        onQueryChange={
          options.loaderType === 'search'
            ? debouncedHandler
            : options.autocompleteProps?.onQueryChange
        }
      />

      {showSettings && options.secrets?.keys && (
        <SettingsView
          title={options.secrets.title ?? 'Secrets'}
          namespace={namespace}
          keys={options.secrets?.keys}
          onClose={() => setShowSettings(false)}
        />
      )}
      {options.secrets && (
        <Flex justify={'flex-end'} padding={2} paddingRight={0}>
          <Button
            fontSize={0}
            icon={ApiIcon}
            mode="ghost"
            padding={2}
            radius="full"
            text="Manage keys"
            onClick={() => setShowSettings(true)}
          />
        </Flex>
      )}
    </Card>
  )
}

/**
 * Create a Sanity string input component bound to the given async-list
 * `options`. Use this for the `components.input` slot when wiring the input
 * manually (i.e. without the `asyncList()` plugin):
 *
 * ```ts
 * import {defineField} from 'sanity'
 * import {createAsyncListInput} from '@sanity/sanity-plugin-async-list'
 *
 * defineField({
 *   name: 'myString',
 *   type: 'string',
 *   components: {
 *     input: createAsyncListInput({
 *       loader: async () => {
 *         // ...return [{value: 'a'}, {value: 'b'}]
 *       },
 *     }),
 *   },
 * })
 * ```
 *
 * @public
 */
export function createAsyncListInput(
  options: AsyncListInputOptions,
): (props: StringInputProps) => JSX.Element {
  return function AsyncListInput(props: StringInputProps): JSX.Element {
    'use memo'
    return <AsyncList {...props} options={options} />
  }
}
