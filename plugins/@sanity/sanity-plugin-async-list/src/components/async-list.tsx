import {ApiIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Autocomplete, Button, Card, Flex, Text} from '@sanity/ui'
import {debounce} from 'lodash'
import {type JSX, useCallback, useEffect, useState} from 'react'
import {set, type StringInputProps, unset, useClient} from 'sanity'

import type {AsyncListPluginConfig} from '..'

// Object for Autocomplpete's `options` prop
interface OptionsItem {
  value: string
  [key: string]: unknown
}

// Autocomplete options validation
function validOptions(arr: unknown): arr is OptionsItem[] {
  return (
    (Array.isArray(arr) && arr.length === 0) ||
    (Array.isArray(arr) &&
      arr.length > 0 &&
      arr.every((item) => typeof item === 'object' && item !== null && 'value' in item))
  )
}
/**
 * TODO:
 * - Cache fetchData call w/o arguments
 */
export const AsyncList = (
  props: StringInputProps,
  options: Omit<AsyncListPluginConfig, 'schemaType'> &
    Partial<Pick<AsyncListPluginConfig, 'schemaType'>>,
): JSX.Element => {
  const namespace = options.secrets?.namespace ?? `async-list-${options.schemaType}`
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
      fetchData()
    }
  }, [fetchData, data, secrets, options.secrets, props.value])

  // If config declares secrets, show settings when no secrets found by useSecrets()
  // useEffect(() => {
  //   if (options.secrets) {
  //     setShowSettings(!secrets)
  //   }
  // }, [secrets, options.secrets])

  // Set field value in content lake
  const handleChange = useCallback(
    (value?: string) => props.onChange(value ? set(value) : unset()),
    [props],
  )
  // Handle searching in 'search' mode
  const handleQueryChange = useCallback(
    (query: string | null) => {
      if (
        query === '' || // User hit backspace or
        (!query && !props.value && prevQuery) // they cleared out an existing value or query
      ) {
        if (!data) {
          fetchData()
        }
      }
      if (query) {
        fetchData(query)
      }
      setPrevQuery(query)
    },
    [fetchData, data, props.value, prevQuery],
  )

  // Debounce query events so we don't spam the loader
  const debouncedHandler = debounce((value) => handleQueryChange(value), 300)

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
        id={`async-list-${options.schemaType}`}
        // eslint-disable-next-line react/jsx-no-bind
        filterOption={options.loaderType === 'search' ? () => true : undefined}
        // eslint-disable-next-line react/jsx-no-bind
        icon={
          loading
            ? () => (
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
            : SearchIcon
        }
        openButton
        onChange={handleChange}
        options={data ?? []}
        value={props.value}
        onQueryChange={options.loaderType === 'search' ? debouncedHandler : undefined}
        {...options.autocompleteProps}
      />

      {showSettings && options.secrets?.keys && (
        <SettingsView
          title={options.secrets.title ?? 'Secrets'}
          namespace={namespace}
          keys={options.secrets?.keys}
          // eslint-disable-next-line react/jsx-no-bind
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
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => setShowSettings(true)}
          />
        </Flex>
      )}
    </Card>
  )
}
